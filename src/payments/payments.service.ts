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
import { PaymentRepository } from './repositories/payment.repository.js';
import {
  toPaymentResponse,
  toPaymentVerifyResponse,
} from './dto/payment.dto.js';
import type { PaymentGateway } from './entities/payment.entity.js';
import { Payment } from './entities/payment.entity.js';
import { Order } from './entities/order.entity.js';

export type PaymentMethod = 'credit' | 'zarinpal' | 'zibal' | 'loan';

@Injectable()
export class PaymentsService {
  private readonly providers: Record<
    Exclude<PaymentMethod, 'credit'>,
    ExternalPaymentProvider
  >;

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
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

  requestPayment(userId: string, orderId: string, method: PaymentMethod) {
    if (method === 'credit') {
      return this.payWithCredit(userId, orderId);
    }
    return this.createExternalPayment(userId, orderId, method);
  }

  verifyZarinpalPayment(authority: string, status: string) {
    return this.verifyExternalPayment('zarinpal', authority, status === 'OK');
  }

  verifyZibalPayment(trackId: number, success: number) {
    return this.verifyExternalPayment('zibal', String(trackId), success === 1);
  }

  verifyLoanPayment(authority: string, success: number) {
    return this.verifyExternalPayment('loan', authority, success === 1);
  }

  private async payWithCredit(userId: string, orderId: string) {
    const order = await this.requirePayableOrder(userId, orderId);
    const amount = Number(order.amount);
    const breakdown = this.getOrderBreakdown(order);

    const result = await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const orderRepo = manager.getRepository(Order);

      let payment = await paymentRepo.findOneBy({ orderId: order.id });
      if (payment?.status === 'success') {
        throw new ApiException(
          'ORDER_ALREADY_PAID',
          'این سفارش قبلاً پرداخت شده است',
          HttpStatus.CONFLICT,
        );
      }

      const authority = `CREDIT-${randomBytes(10).toString('hex').toUpperCase()}`;
      if (payment) {
        Object.assign(payment, {
          gateway: 'credit' as const,
          authority,
          amount,
          status: 'pending' as const,
          refId: null,
          callbackUrl: null,
        });
      } else {
        payment = paymentRepo.create({
          orderId: order.id,
          gateway: 'credit',
          authority,
          amount,
          status: 'pending',
          callbackUrl: null,
        });
      }
      payment = await paymentRepo.save(payment);

      // مسیر واحد credit: فقط charge از موجودی فعلی
      const { balanceAfter } = await this.creditService.payOrderViaCredit(
        userId,
        amount,
        {
          reason: 'order_pay_credit',
          orderId: order.id,
          paymentId: payment.id,
          depositFromGateway: false,
        },
        manager,
      );

      payment.status = 'success';
      payment.refId = `CR-${payment.id.slice(-8)}`;
      await paymentRepo.save(payment);

      await orderRepo.update({ id: order.id }, { status: 'paid' });

      return { payment, balanceAfter };
    });

    return toPaymentResponse({
      orderId: order.id,
      paymentId: result.payment.id,
      gateway: 'credit',
      authority: result.payment.authority,
      paymentUrl: '',
      amount,
      ...breakdown,
      shippingMethod: order.shippingMethod
        ? toShippingMethodResponse(order.shippingMethod)
        : null,
      gatewayMessage: `پرداخت از کیف پول انجام شد. موجودی باقی‌مانده: ${result.balanceAfter}`,
      creditBalance: result.balanceAfter,
    });
  }

  private async createExternalPayment(
    userId: string,
    orderId: string,
    gateway: Exclude<PaymentMethod, 'credit'>,
  ) {
    const provider = this.providers[gateway];
    const order = await this.requirePayableOrder(userId, orderId);
    const existingPayment = await this.paymentRepository.findByOrderId(
      order.id,
    );

    if (existingPayment?.status === 'success') {
      throw new ApiException(
        'ORDER_ALREADY_PAID',
        'این سفارش قبلاً پرداخت شده است',
        HttpStatus.CONFLICT,
      );
    }

    const breakdown = this.getOrderBreakdown(order);
    const shippingMethod = order.shippingMethod
      ? toShippingMethodResponse(order.shippingMethod)
      : null;

    if (
      existingPayment?.status === 'pending' &&
      existingPayment.gateway === gateway
    ) {
      return toPaymentResponse({
        orderId: order.id,
        paymentId: existingPayment.id,
        gateway,
        authority: existingPayment.authority,
        paymentUrl: provider.buildPaymentUrl(existingPayment.authority),
        amount: Number(existingPayment.amount),
        ...breakdown,
        shippingMethod,
        gatewayMessage: 'درخواست پرداخت قبلی برای این سفارش فعال است',
      });
    }

    const amount = Number(order.amount);
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

    const payment = existingPayment
      ? await this.paymentRepository.save(
          Object.assign(existingPayment, {
            gateway,
            authority: gatewayResult.authority,
            amount,
            status: 'pending' as const,
            refId: null,
            callbackUrl,
          }),
        )
      : await this.paymentRepository.save(
          this.paymentRepository.create({
            orderId: order.id,
            gateway,
            authority: gatewayResult.authority,
            amount,
            status: 'pending',
            callbackUrl,
          }),
        );

    return toPaymentResponse({
      orderId: order.id,
      paymentId: payment.id,
      gateway,
      authority: gatewayResult.authority,
      paymentUrl: gatewayResult.paymentUrl,
      amount,
      ...breakdown,
      shippingMethod,
      gatewayMessage: gatewayResult.message,
    });
  }

  private async verifyExternalPayment(
    gateway: Exclude<PaymentMethod, 'credit'>,
    authority: string,
    isSuccess: boolean,
  ) {
    const payment = await this.paymentRepository.findByAuthority(authority);

    if (!payment) {
      throw new ApiException(
        'PAYMENT_NOT_FOUND',
        'تراکنش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (payment.gateway !== gateway) {
      throw new ApiException(
        'PAYMENT_GATEWAY_MISMATCH',
        'درگاه پرداخت با تراکنش مطابقت ندارد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const provider = this.providers[gateway];
    const orderBreakdown = this.getOrderBreakdown(payment.order);

    if (payment.status === 'success') {
      return toPaymentVerifyResponse({
        orderId: payment.orderId,
        paymentId: payment.id,
        gateway,
        refId: payment.refId ?? '',
        status: 'success',
        amount: Number(payment.amount),
        ...orderBreakdown,
        productName: payment.order?.items
          ?.map((item) => item.product?.name)
          .filter(Boolean)
          .join('، '),
        gatewayMessage: 'این تراکنش قبلاً تأیید شده است',
      });
    }

    if (!isSuccess) {
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Payment)
          .update({ id: payment.id }, { status: 'failed' });
        if (payment.order) {
          await manager
            .getRepository(Order)
            .update({ id: payment.orderId }, { status: 'failed' });
        }
      });

      throw new ApiException(
        'PAYMENT_CANCELLED',
        'پرداخت توسط کاربر لغو شد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amount = Number(payment.amount);
    const verifyResult = provider.verifyPayment(authority, amount);
    const userId = payment.order?.userId;
    if (!userId) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        'سفارش تراکنش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    // ACID: verify → deposit credit → charge credit → mark paid
    const settled = await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const locked = await paymentRepo.findOne({
        where: { id: payment.id },
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
        return { already: true as const, balanceAfter: null as number | null };
      }

      const { balanceAfter } = await this.creditService.payOrderViaCredit(
        userId,
        amount,
        {
          reason: `gateway_${gateway}`,
          orderId: locked.orderId,
          paymentId: locked.id,
          depositFromGateway: true,
        },
        manager,
      );

      locked.status = 'success';
      locked.refId = verifyResult.refId;
      await paymentRepo.save(locked);
      await manager
        .getRepository(Order)
        .update({ id: locked.orderId }, { status: 'paid' });

      return { already: false as const, balanceAfter };
    });

    return toPaymentVerifyResponse({
      orderId: payment.orderId,
      paymentId: payment.id,
      gateway,
      refId: verifyResult.refId,
      status: 'success',
      amount,
      ...orderBreakdown,
      productName: payment.order?.items
        ?.map((item) => item.product?.name)
        .filter(Boolean)
        .join('، '),
      gatewayMessage: settled.already
        ? 'این تراکنش قبلاً تأیید شده است'
        : `${verifyResult.message} — مبلغ ابتدا به کیف پول واریز و سپس کسر شد`,
      creditBalance: settled.balanceAfter ?? undefined,
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
