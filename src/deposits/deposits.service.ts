import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '../config/config.service.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { toShippingMethodResponse } from '../shipping/dto/shipping.dto.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { CreditService } from '../credit/credit.service.js';
import { LoanMockService } from './services/loan-mock.service.js';
import type { ExternalPaymentProvider } from './services/deposit-gateway.interface.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import { TransactionService } from './transaction.service.js';
import { toDepositResponse } from './dto/deposit.dto.js';
import { Deposit } from './entities/deposit.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { ZIBAL_PROVIDER } from './zibal.constants.js';

export type DepositMethod = 'credit' | 'iBank' | 'loan';

@Injectable()
export class DepositsService {
  private readonly providers: Record<
    Exclude<DepositMethod, 'credit'>,
    ExternalPaymentProvider
  >;

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly depositRepository: DepositRepository,
    private readonly transactionService: TransactionService,
    private readonly creditService: CreditService,
    @Inject(ZIBAL_PROVIDER) zibalProvider: ExternalPaymentProvider,
    loanMockService: LoanMockService,
  ) {
    this.providers = {
      iBank: zibalProvider,
      loan: loanMockService,
    };
  }

  requestPayment(userId: string, orderId: string, method: DepositMethod) {
    if (method === 'credit') {
      return this.payOrderWithCredit(userId, orderId);
    }
    return this.createOrderGatewayDeposit(userId, orderId, method);
  }

  /** شارژ کیف پول بدون سفارش — فقط واریز */
  async createWalletTopUp(
    userId: string,
    amount: number,
    gateway: Exclude<DepositMethod, 'credit'> = 'iBank',
  ) {
    const rounded = Math.round(Number(amount));
    if (!Number.isInteger(rounded) || rounded <= 0) {
      throw new ApiException(
        'INVALID_AMOUNT',
        'مبلغ واریز باید عدد صحیح مثبت باشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const provider = this.providers[gateway];
    const callbackUrl =
      gateway === 'iBank'
        ? this.config.get('ZIBAL_CALLBACK_URL')
        : this.config.get('LOAN_CALLBACK_URL');

    const gatewayResult = await provider.requestPayment(
      rounded,
      'شارژ کیف پول',
      userId,
    );

    const entity = await this.dataSource.transaction(async (manager) => {
      const depositRepo = manager.getRepository(Deposit);
      const deposit = await depositRepo.save(
        depositRepo.create({
          userId,
          orderId: null,
          gateway,
          trackId: gatewayResult.trackId,
          amount: rounded,
          status: 'pending',
          callbackUrl,
        }),
      );

      await this.transactionService.addTransaction(
        {
          userId,
          amount: rounded,
          type: 'credit',
          sourceType: 'DEPOSIT',
          sourceId: deposit.id,
          orderId: null,
          state: 'pending',
          description: `شارژ کیف پول از ${gateway}`,
        },
        manager,
      );

      return deposit;
    });

    return toDepositResponse({
      orderId: null,
      depositId: entity.id,
      gateway,
      trackId: entity.trackId,
      paymentUrl: provider.buildPaymentUrl(entity.trackId),
      amount: rounded,
      gatewayMessage: gatewayResult.message,
    });
  }

  listDeposits(
    offset: number,
    limit: number,
    filters: { userId?: string; status?: Deposit['status'] } = {},
  ) {
    return this.depositRepository.findPaginated(offset, limit, filters);
  }

  /** پرداخت سفارش از موجودی — فقط transaction (debit)، نه deposit */
  private async payOrderWithCredit(userId: string, orderId: string) {
    const order = await this.requirePayableOrder(userId, orderId);
    const amount = Math.round(Number(order.amount));
    const breakdown = this.getOrderBreakdown(order);

    const result = await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const lockedOrder = await orderRepo.findOne({
        where: { id: order.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedOrder || lockedOrder.status !== 'pending') {
        throw new ApiException(
          'ORDER_ALREADY_PAID',
          'این سفارش قبلاً پرداخت شده است',
          HttpStatus.CONFLICT,
        );
      }

      const tx = await this.transactionService.addTransaction(
        {
          userId,
          amount,
          type: 'debit',
          sourceType: 'ORDER_PAYMENT',
          orderId: order.id,
          state: 'pending',
          description: 'پرداخت سفارش از کیف پول',
        },
        manager,
      );

      const wallet = await this.creditService.decrementTotalAmount(
        userId,
        amount,
        { sourceId: tx.id },
        manager,
      );

      await this.transactionService.updateTransactions(
        [tx.id],
        'executed',
        manager,
      );
      await orderRepo.update({ id: order.id }, { status: 'paid' });

      return { transactionId: tx.id, amountAfter: Number(wallet.amount) };
    });

    return toDepositResponse({
      orderId: order.id,
      transactionId: result.transactionId,
      gateway: 'credit',
      trackId: `TX-${result.transactionId.slice(-10)}`,
      paymentUrl: '',
      amount,
      ...breakdown,
      shippingMethod: order.shippingMethod
        ? toShippingMethodResponse(order.shippingMethod)
        : null,
      gatewayMessage: `پرداخت از کیف پول انجام شد. موجودی باقی‌مانده: ${result.amountAfter}`,
      creditBalance: result.amountAfter,
    });
  }

  private async createOrderGatewayDeposit(
    userId: string,
    orderId: string,
    gateway: Exclude<DepositMethod, 'credit'>,
  ) {
    const provider = this.providers[gateway];
    const order = await this.requirePayableOrder(userId, orderId);

    const breakdown = this.getOrderBreakdown(order);
    const shippingMethod = order.shippingMethod
      ? toShippingMethodResponse(order.shippingMethod)
      : null;

    const amount = Math.round(Number(order.amount));
    const productName =
      order.items
        ?.map((item) => item.product?.name)
        .filter(Boolean)
        .join('، ') || 'سفارش';

    const gatewayResult = await provider.requestPayment(
      amount,
      productName,
      order.id,
    );

    const callbackUrl =
      gateway === 'iBank'
        ? this.config.get('ZIBAL_CALLBACK_URL')
        : this.config.get('LOAN_CALLBACK_URL');

    const deposit = await this.dataSource.transaction(async (manager) => {
      const depositRepo = manager.getRepository(Deposit);
      const existing = await depositRepo.findOne({
        where: {
          userId,
          orderId: order.id,
          gateway,
          status: 'pending',
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing) {
        return { reuse: true as const, entity: existing };
      }

      const successExists = await depositRepo.findOne({
        where: { orderId: order.id, status: 'success' },
      });
      if (successExists) {
        throw new ApiException(
          'ORDER_ALREADY_PAID',
          'این سفارش قبلاً پرداخت شده است',
          HttpStatus.CONFLICT,
        );
      }

      const entity = await depositRepo.save(
        depositRepo.create({
          userId,
          orderId: order.id,
          gateway,
          trackId: gatewayResult.trackId,
          amount,
          status: 'pending',
          callbackUrl,
        }),
      );

      await this.transactionService.addTransaction(
        {
          userId,
          amount,
          type: 'credit',
          sourceType: 'DEPOSIT',
          sourceId: entity.id,
          orderId: order.id,
          state: 'pending',
          description: `درخواست واریز از ${gateway}`,
        },
        manager,
      );

      return { reuse: false as const, entity };
    });

    const entity = deposit.entity;
    return toDepositResponse({
      orderId: order.id,
      depositId: entity.id,
      gateway,
      trackId: entity.trackId,
      paymentUrl: provider.buildPaymentUrl(entity.trackId),
      amount: Number(entity.amount),
      ...breakdown,
      shippingMethod,
      gatewayMessage: deposit.reuse
        ? 'درخواست واریز قبلی برای این سفارش فعال است'
        : gatewayResult.message,
    });
  }

  private async requirePayableOrder(userId: string, orderId: string) {
    const order = await this.orderRepository.findByIdForUser(orderId, userId);

    if (!order) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        'سفارش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (order.status !== 'pending') {
      throw new ApiException(
        'ORDER_NOT_PAYABLE',
        'این سفارش قابل پرداخت نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    return order;
  }

  private getOrderBreakdown(order?: {
    subtotal?: number;
    shippingAmount?: number;
    amount?: number;
    shippingMethod?: Parameters<typeof toShippingMethodResponse>[0] | null;
  }) {
    if (!order) {
      return {
        subtotal: undefined,
        shippingAmount: undefined,
        displayTotal: undefined,
        shippingMethod: undefined,
      };
    }
    const subtotal = Number(order.subtotal ?? order.amount ?? 0);
    const shippingAmount = Number(order.shippingAmount ?? 0);

    return {
      subtotal,
      shippingAmount,
      displayTotal: subtotal + shippingAmount,
      shippingMethod: order.shippingMethod
        ? toShippingMethodResponse(order.shippingMethod)
        : undefined,
    };
  }
}
