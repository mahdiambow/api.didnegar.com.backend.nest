import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { toShippingMethodResponse } from '../shipping/dto/shipping.dto.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { PaymentRepository } from './repositories/payment.repository.js';
import { CreateZarinpalPaymentDto } from './dto/zarinpal-payment.dto.js';
import {
  toZarinpalPaymentResponse,
  toZarinpalVerifyResponse,
} from './dto/zarinpal-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly zarinpalMockService: ZarinpalMockService,
  ) {}

  async createZarinpalPayment(userId: string, dto: CreateZarinpalPaymentDto) {
    const order = await this.orderRepository.findByIdForUser(
      dto.orderId,
      userId,
    );

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

    if (existingPayment?.status === 'pending') {
      return toZarinpalPaymentResponse({
        orderId: order.id,
        paymentId: existingPayment.id,
        authority: existingPayment.authority,
        paymentUrl: `${process.env.ZARINPAL_SANDBOX_URL ?? 'https://sandbox.zarinpal.com/pg/StartPay'}/${existingPayment.authority}`,
        amount: Number(existingPayment.amount),
        ...this.getOrderBreakdown(order),
        shippingMethod: order.shippingMethod
          ? toShippingMethodResponse(order.shippingMethod)
          : null,
        gatewayMessage: 'درخواست پرداخت قبلی برای این سفارش فعال است',
      });
    }

    const amount = Number(order.amount);
    const productName = order.product?.name ?? 'سفارش';

    const gatewayResult = this.zarinpalMockService.requestPayment(
      amount,
      productName,
    );

    const payment = await this.paymentRepository.save(
      this.paymentRepository.create({
        orderId: order.id,
        gateway: 'zarinpal',
        authority: gatewayResult.authority,
        amount,
        status: 'pending',
        callbackUrl: process.env.ZARINPAL_CALLBACK_URL ?? null,
      }),
    );

    const breakdown = this.getOrderBreakdown(order);

    return toZarinpalPaymentResponse({
      orderId: order.id,
      paymentId: payment.id,
      authority: gatewayResult.authority,
      paymentUrl: gatewayResult.paymentUrl,
      amount,
      ...breakdown,
      shippingMethod: order.shippingMethod
        ? toShippingMethodResponse(order.shippingMethod)
        : null,
      gatewayMessage: gatewayResult.message,
    });
  }

  async verifyZarinpalPayment(authority: string, status: string) {
    const payment = await this.paymentRepository.findByAuthority(authority);
    if (!payment) {
      throw new ApiException(
        'PAYMENT_NOT_FOUND',
        'تراکنش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const orderBreakdown = this.getOrderBreakdown(payment.order);

    if (payment.status === 'success') {
      return toZarinpalVerifyResponse({
        orderId: payment.orderId,
        paymentId: payment.id,
        refId: payment.refId ?? '',
        status: 'success',
        amount: Number(payment.amount),
        ...orderBreakdown,
        productName: payment.order?.product?.name,
        gatewayMessage: 'این تراکنش قبلاً تأیید شده است',
      });
    }

    if (status !== 'OK') {
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

    const verifyResult = this.zarinpalMockService.verifyPayment(
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

    return toZarinpalVerifyResponse({
      orderId: payment.orderId,
      paymentId: payment.id,
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
