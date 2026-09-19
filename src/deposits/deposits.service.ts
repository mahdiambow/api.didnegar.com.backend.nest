import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '../config/config.service.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { toShippingMethodResponse } from '../shipping/dto/shipping.dto.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { CreditService } from '../credit/credit.service.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { LoanMockService } from './services/loan-mock.service.js';
import type { ExternalPaymentProvider } from './services/deposit-gateway.interface.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import { TransactionService } from '../transactions/transaction.service.js';
import {
  toDepositItem,
  toDepositResponse,
  toDepositVerifyResponse,
} from './dto/deposit.dto.js';
import { Deposit } from './entities/deposit.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { ZIBAL_PROVIDER } from './zibal.constants.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import type { ListDepositsQueryDto } from './dto/deposit.dto.js';

export type DepositMethod = 'credit' | 'zarinpal' | 'zibal' | 'loan';

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
    zarinpalMockService: ZarinpalMockService,
    @Inject(ZIBAL_PROVIDER) zibalProvider: ExternalPaymentProvider,
    loanMockService: LoanMockService,
  ) {
    this.providers = {
      zarinpal: zarinpalMockService,
      zibal: zibalProvider,
      loan: loanMockService,
    };
  }

  createZarinpalPayment(userId: string, orderId: string) {
    return this.requestPayment(userId, orderId, 'zarinpal');
  }

  createZibalPayment(userId: string, orderId: string) {
    return this.requestPayment(userId, orderId, 'zibal');
  }

  createLoanPayment(userId: string, orderId: string) {
    return this.requestPayment(userId, orderId, 'loan');
  }

  createCreditPayment(userId: string, orderId: string) {
    return this.requestPayment(userId, orderId, 'credit');
  }

  requestPayment(userId: string, orderId: string, method: DepositMethod) {
    if (method === 'credit') {
      return this.payOrderWithCredit(userId, orderId);
    }
    return this.createOrderGatewayDeposit(userId, orderId, method);
  }

  verifyZarinpalPayment(trackId: string, status: string) {
    return this.verifyGatewayDeposit('zarinpal', trackId, status === 'OK');
  }

  verifyZibalPayment(trackId: number, success: number, status?: number) {
    // طبق callback زیبال: success=1 و status=2 یعنی کاربر پرداخت را کامل کرده
    const paidAtGateway =
      success === 1 && (status == null || Number(status) === 2);
    return this.verifyGatewayDeposit('zibal', String(trackId), paidAtGateway);
  }

  verifyLoanPayment(trackId: string, success: number) {
    return this.verifyGatewayDeposit('loan', trackId, success === 1);
  }

  /** شارژ اعتبار بدون سفارش — فقط واریز */
  async createTopUp(
    userId: string,
    amount: number,
    gateway: Exclude<DepositMethod, 'credit'>,
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
      gateway === 'zarinpal'
        ? this.config.get('ZARINPAL_CALLBACK_URL')
        : gateway === 'zibal'
          ? this.config.get('ZIBAL_CALLBACK_URL')
          : this.config.get('LOAN_CALLBACK_URL');

    const gatewayResult = await provider.requestPayment(
      rounded,
      'شارژ اعتبار',
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
          description: `شارژ اعتبار از ${gateway}`,
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

  async listDepositsPaged(query: ListDepositsQueryDto, userId?: string) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.depositRepository.findPaginated(
      offset,
      limit,
      {
        userId: userId ?? query.userId,
        status: query.status as Deposit['status'] | undefined,
      },
    );
    return paginatedList(items.map(toDepositItem), page, limit, total);
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
      gateway === 'zarinpal'
        ? this.config.get('ZARINPAL_CALLBACK_URL')
        : gateway === 'zibal'
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

  private async verifyGatewayDeposit(
    gateway: Exclude<DepositMethod, 'credit'>,
    trackId: string,
    isSuccess: boolean,
  ) {
    const deposit = await this.depositRepository.findByTrackId(trackId);

    if (!deposit) {
      throw new ApiException(
        'PAYMENT_NOT_FOUND',
        'واریز یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (deposit.gateway !== gateway) {
      throw new ApiException(
        'PAYMENT_GATEWAY_MISMATCH',
        'درگاه با واریز مطابقت ندارد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const provider = this.providers[gateway];
    const orderBreakdown = this.getOrderBreakdown(deposit.order ?? undefined);

    if (deposit.status === 'success') {
      return toDepositVerifyResponse({
        orderId: deposit.orderId,
        depositId: deposit.id,
        gateway,
        refId: deposit.refId ?? '',
        status: 'success',
        amount: Number(deposit.amount),
        ...orderBreakdown,
        productName: deposit.order?.items
          ?.map((item) => item.product?.name)
          .filter(Boolean)
          .join('، '),
        gatewayMessage: 'این واریز قبلاً تأیید شده است',
      });
    }

    if (!isSuccess) {
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Deposit)
          .update({ id: deposit.id }, { status: 'failed' });
        if (deposit.orderId) {
          await manager
            .getRepository(Order)
            .update({ id: deposit.orderId }, { status: 'failed' });
        }
      });

      throw new ApiException(
        'PAYMENT_CANCELLED',
        'پرداخت توسط کاربر لغو شد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amount = Math.round(Number(deposit.amount));
    const verifyResult = await provider.verifyPayment(trackId, amount);
    const userId = deposit.userId;

    const settled = await this.dataSource.transaction(async (manager) => {
      const depositRepo = manager.getRepository(Deposit);
      const locked = await depositRepo.findOne({
        where: { id: deposit.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) {
        throw new ApiException(
          'PAYMENT_NOT_FOUND',
          'واریز یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      if (locked.status === 'success') {
        return {
          already: true as const,
          amountAfter: null as number | null,
          transactionId: null as string | null,
        };
      }

      await this.creditService.incrementTotalAmount(
        userId,
        amount,
        { sourceId: locked.id },
        manager,
      );

      const pendingDepositTx =
        await this.transactionService.findPendingBySourceId(
          locked.id,
          manager,
        );
      let depositTxId: string;
      if (pendingDepositTx) {
        await this.transactionService.updateTransactions(
          [pendingDepositTx.id],
          'executed',
          manager,
        );
        depositTxId = pendingDepositTx.id;
      } else {
        const depositTx = await this.transactionService.addTransaction(
          {
            userId,
            amount,
            type: 'credit',
            sourceType: 'DEPOSIT',
            sourceId: locked.id,
            orderId: locked.orderId,
            state: 'executed',
            description: `واریز موفق از ${gateway}`,
          },
          manager,
        );
        depositTxId = depositTx.id;
      }

      locked.status = 'success';
      locked.refId = verifyResult.refId;
      await depositRepo.save(locked);

      let amountAfter = 0;
      let paymentTxId: string | null = null;

      if (locked.orderId) {
        const paymentTx = await this.transactionService.addTransaction(
          {
            userId,
            amount,
            type: 'debit',
            sourceType: 'ORDER_PAYMENT',
            sourceId: locked.id,
            orderId: locked.orderId,
            state: 'pending',
            description: 'پرداخت سفارش پس از واریز درگاه',
          },
          manager,
        );

        const wallet = await this.creditService.decrementTotalAmount(
          userId,
          amount,
          { sourceId: paymentTx.id },
          manager,
        );
        amountAfter = Number(wallet.amount);

        await this.transactionService.updateTransactions(
          [paymentTx.id],
          'executed',
          manager,
        );
        paymentTxId = paymentTx.id;

        await manager
          .getRepository(Order)
          .update({ id: locked.orderId }, { status: 'paid' });
      } else {
        const wallet = await this.creditService.getBalance(userId);
        amountAfter = wallet.amount;
      }

      return {
        already: false as const,
        amountAfter,
        transactionId: paymentTxId ?? depositTxId,
      };
    });

    return toDepositVerifyResponse({
      orderId: deposit.orderId,
      depositId: deposit.id,
      transactionId: settled.transactionId ?? undefined,
      gateway,
      refId: verifyResult.refId,
      status: 'success',
      amount,
      ...orderBreakdown,
      productName: deposit.order?.items
        ?.map((item) => item.product?.name)
        .filter(Boolean)
        .join('، '),
      gatewayMessage: settled.already
        ? 'این واریز قبلاً تأیید شده است'
        : deposit.orderId
          ? `${verifyResult.message} — واریز به کیف پول سپس پرداخت سفارش`
          : `${verifyResult.message} — کیف پول شارژ شد`,
      creditBalance: settled.amountAfter ?? undefined,
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
