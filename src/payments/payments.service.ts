import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { toShippingMethodResponse } from '../shipping/dto/shipping.dto.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { ZibalMockService } from './services/zibal-mock.service.js';
import type { PaymentGatewayAdapter } from './services/payment-gateway.interface.js';
import { PaymentRepository } from './repositories/payment.repository.js';
import {
  toPaymentResponse,
  toPaymentVerifyResponse,
} from './dto/payment.dto.js';
import type { PaymentGateway } from './entities/payment.entity.js';

@Injectable()
export class PaymentsService {
  private readonly gateways: Record<PaymentGateway, PaymentGatewayAdapter>;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    zarinpalMockService: ZarinpalMockService,
    zibalMockService: ZibalMockService,
  ) {
    this.gateways = {
      zarinpal: zarinpalMockService,
      zibal: zibalMockService,
    };
  }

  createZarinpalPayment(userId: string, orderId: string) {
    return this.createPayment(userId, orderId, 'zarinpal');
  }

  createZibalPayment(userId: string, orderId: string) {
    return this.createPayment(userId, orderId, 'zibal');
  }

  verifyZarinpalPayment(authority: string, status: string) {
    return this.verifyPayment('zarinpal', authority, status === 'OK');
  }

  verifyZibalPayment(trackId: number, success: number) {
    return this.verifyPayment('zibal', String(trackId), success === 1);
  }

  private async createPayment(
    userId: string,
    orderId: string,
    gateway: PaymentGateway,
  ) {
    const adapter = this.gateways[gateway];
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

    const existingPayment = await this.paymentRepository.findByOrderId(order.id);

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
        paymentUrl: adapter.buildPaymentUrl(existingPayment.authority),
        amount: Number(existingPayment.amount),
        ...breakdown,
        shippingMethod,
        gatewayMessage: 'درخواست پرداخت قبلی برای این سفارش فعال است',
      });
    }

    const amount = Number(order.amount);
    const productName = order.product?.name ?? 'سفارش';

    const gatewayResult = adapter.requestPayment(amount, productName, order.id);

    const payment = existingPayment
      ? await this.paymentRepository.save(
          Object.assign(existingPayment, {
            gateway,
            authority: gatewayResult.authority,
            amount,
            status: 'pending' as const,
            refId: null,
            callbackUrl:
              gateway === 'zarinpal'
                ? (process.env.ZARINPAL_CALLBACK_URL ?? null)
                : (process.env.ZIBAL_CALLBACK_URL ?? null),
          }),
        )
      : await this.paymentRepository.save(
          this.paymentRepository.create({
            orderId: order.id,
            gateway,
            authority: gatewayResult.authority,
            amount,
            status: 'pending',
            callbackUrl:
              gateway === 'zarinpal'
                ? (process.env.ZARINPAL_CALLBACK_URL ?? null)
                : (process.env.ZIBAL_CALLBACK_URL ?? null),
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

  private async verifyPayment(
    gateway: PaymentGateway,
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

    const adapter = this.gateways[gateway];
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
        productName: payment.order?.product?.name,
        gatewayMessage: 'این تراکنش قبلاً تأیید شده است',
      });
    }

    if (!isSuccess) {
      payment.status = 'failed';
      if (payment.order) {
        payment.order.status = 'failed';
        await this.orderRepository.save(payment.order);
      }
      await this.paymentRepository.save(payment);

      throw new ApiException(
        'PAYMENT_CANCELLED',
        'پرداخت توسط کاربر لغو شد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const verifyResult = adapter.verifyPayment(
      authority,
      Number(payment.amount),
    );

    payment.status = 'success';
    payment.refId = verifyResult.refId;

    if (payment.order) {
      payment.order.status = 'paid';
      await this.orderRepository.save(payment.order);
    }

    await this.paymentRepository.save(payment);

    return toPaymentVerifyResponse({
      orderId: payment.orderId,
      paymentId: payment.id,
      gateway,
      refId: verifyResult.refId,
      status: 'success',
      amount: Number(payment.amount),
      ...orderBreakdown,
      productName: payment.order?.product?.name,
      gatewayMessage: verifyResult.message,
    });
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
