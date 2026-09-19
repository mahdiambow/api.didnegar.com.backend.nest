import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '../config/config.service.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { toShippingMethodResponse } from '../shipping/dto/shipping.dto.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { CreditService } from '../credit/credit.service.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { ZibalMockService } from './services/zibal-mock.service.js';
import { LoanMockService } from './services/loan-mock.service.js';
import type { ExternalPaymentProvider } from './services/payment-gateway.interface.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import {
  toDepositResponse,
  toDepositVerifyResponse,
} from './dto/payment.dto.js';
import { Deposit } from './entities/deposit.entity.js';
import { Order } from './entities/order.entity.js';

export type DepositMethod = 'credit' | 'zarinpal' | 'zibal' | 'loan';

@Injectable()
export class PaymentsService {
  private readonly providers: Record<
    Exclude<DepositMethod, 'credit'>,
    ExternalPaymentProvider
  >;

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly depositRepository: DepositRepository,
    private readonly creditService: CreditService,
    zarinpalMockService: ZarinpalMockService,
    zibalMockService: ZibalMockService,
    loanMockService: LoanMockService,
  ) {
    this.providers = {
      zarinpal: zarinpalMockService,
      zibal: zibalMockService,
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
      return this.payWithCredit(userId, orderId);
    }
    return this.createExternalDeposit(userId, orderId, method);
  }

  verifyZarinpalPayment(trackId: string, status: string) {
    return this.verifyExternalDeposit('zarinpal', trackId, status === 'OK');
  }

  verifyZibalPayment(trackId: number, success: number) {
    return this.verifyExternalDeposit('zibal', String(trackId), success === 1);
  }

  verifyLoanPayment(trackId: string, success: number) {
    return this.verifyExternalDeposit('loan', trackId, success === 1);
  }

  private async payWithCredit(userId: string, orderId: string) {
    const order = await this.requirePayableOrder(userId, orderId);
    const amount = Math.round(Number(order.amount));
    const breakdown = this.getOrderBreakdown(order);

    const result = await this.dataSource.transaction(async (manager) => {
      const depositRepo = manager.getRepository(Deposit);
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

      let deposit = await depositRepo.findOne({
        where: { orderId: order.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (deposit?.status === 'success') {
        throw new ApiException(
          'ORDER_ALREADY_PAID',
          'این سفارش قبلاً پرداخت شده است',
          HttpStatus.CONFLICT,
        );
      }

      const trackId = `CREDIT-${randomBytes(10).toString('hex').toUpperCase()}`;
      if (deposit) {
        Object.assign(deposit, {
          gateway: 'credit' as const,
          trackId,
          amount,
          status: 'pending' as const,
          refId: null,
          callbackUrl: null,
        });
      } else {
        deposit = depositRepo.create({
          orderId: order.id,
          gateway: 'credit',
          trackId,
          amount,
          status: 'pending',
          callbackUrl: null,
        });
      }
      deposit = await depositRepo.save(deposit);

      const wallet = await this.creditService.decrementTotalAmount(
        userId,
        amount,
        { sourceId: deposit.id },
        manager,
      );

      deposit.status = 'success';
      deposit.refId = `CR-${deposit.id.slice(-8)}`;
      await depositRepo.save(deposit);

      await orderRepo.update({ id: order.id }, { status: 'paid' });

      return { deposit, amountAfter: Number(wallet.amount) };
    });

    return toDepositResponse({
      orderId: order.id,
      depositId: result.deposit.id,
      gateway: 'credit',
      trackId: result.deposit.trackId,
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

  private async createExternalDeposit(
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

    const gatewayResult = provider.requestPayment(
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
        where: { orderId: order.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing?.status === 'success') {
        throw new ApiException(
          'ORDER_ALREADY_PAID',
          'این سفارش قبلاً پرداخت شده است',
          HttpStatus.CONFLICT,
        );
      }

      if (existing?.status === 'pending' && existing.gateway === gateway) {
        return { reuse: true as const, entity: existing };
      }

      if (existing) {
        Object.assign(existing, {
          gateway,
          trackId: gatewayResult.trackId,
          amount,
          status: 'pending' as const,
          refId: null,
          callbackUrl,
        });
        return {
          reuse: false as const,
          entity: await depositRepo.save(existing),
        };
      }

      return {
        reuse: false as const,
        entity: await depositRepo.save(
          depositRepo.create({
            orderId: order.id,
            gateway,
            trackId: gatewayResult.trackId,
            amount,
            status: 'pending',
            callbackUrl,
          }),
        ),
      };
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
        ? 'درخواست پرداخت قبلی برای این سفارش فعال است'
        : gatewayResult.message,
    });
  }

  private async verifyExternalDeposit(
    gateway: Exclude<DepositMethod, 'credit'>,
    trackId: string,
    isSuccess: boolean,
  ) {
    const deposit = await this.depositRepository.findByTrackId(trackId);

    if (!deposit) {
      throw new ApiException(
        'PAYMENT_NOT_FOUND',
        'تراکنش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (deposit.gateway !== gateway) {
      throw new ApiException(
        'PAYMENT_GATEWAY_MISMATCH',
        'درگاه پرداخت با تراکنش مطابقت ندارد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const provider = this.providers[gateway];
    const orderBreakdown = this.getOrderBreakdown(deposit.order);

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
        gatewayMessage: 'این تراکنش قبلاً تأیید شده است',
      });
    }

    if (!isSuccess) {
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Deposit)
          .update({ id: deposit.id }, { status: 'failed' });
        if (deposit.order) {
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
    const verifyResult = provider.verifyPayment(trackId, amount);
    const userId = deposit.order?.userId;
    if (!userId) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        'سفارش تراکنش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    // ACID: verify → credit increment → credit decrement → mark paid
    const settled = await this.dataSource.transaction(async (manager) => {
      const depositRepo = manager.getRepository(Deposit);
      const locked = await depositRepo.findOne({
        where: { id: deposit.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) {
        throw new ApiException(
          'PAYMENT_NOT_FOUND',
          'تراکنش یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      if (locked.status === 'success') {
        return { already: true as const, amountAfter: null as number | null };
      }

      await this.creditService.incrementTotalAmount(
        userId,
        amount,
        { sourceId: locked.id },
        manager,
      );
      const wallet = await this.creditService.decrementTotalAmount(
        userId,
        amount,
        { sourceId: locked.id },
        manager,
      );

      locked.status = 'success';
      locked.refId = verifyResult.refId;
      await depositRepo.save(locked);
      await manager
        .getRepository(Order)
        .update({ id: locked.orderId }, { status: 'paid' });

      return { already: false as const, amountAfter: Number(wallet.amount) };
    });

    return toDepositVerifyResponse({
      orderId: deposit.orderId,
      depositId: deposit.id,
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
        ? 'این تراکنش قبلاً تأیید شده است'
        : `${verifyResult.message} — مبلغ ابتدا به کیف پول واریز و سپس کسر شد`,
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
    const subtotal = Number(order?.subtotal ?? order?.amount ?? 0);
    const shippingAmount = Number(order?.shippingAmount ?? 0);

    return {
      subtotal,
      shippingAmount,
      displayTotal: subtotal + shippingAmount,
      shippingMethod: order?.shippingMethod
        ? toShippingMethodResponse(order.shippingMethod)
        : undefined,
    };
  }
}
