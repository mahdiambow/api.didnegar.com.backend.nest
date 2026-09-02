import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../orders/repositories/order.repository.js';
import { PaymentRepository } from '../../payments/repositories/payment.repository.js';
import { ProductRepository } from '../../products/repositories/product.repository.js';
import { ShippingMethodRepository } from '../../shipping/repositories/shipping-method.repository.js';
import { UsersSeedService } from './users.seed.service.js';

@Injectable()
export class OrdersSeedService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly productRepository: ProductRepository,
    private readonly shippingMethodRepository: ShippingMethodRepository,
    private readonly usersSeedService: UsersSeedService,
  ) {}

  async seed() {
    const userId = await this.usersSeedService.findUserIdByUsername('09333333333');
    const product = await this.productRepository.findBySlug('galaxy-s24-ultra');
    const shipping = await this.shippingMethodRepository.findBySlug('mahex-cod');

    if (!userId || !product || !shipping) {
      return;
    }

    await this.seedPendingOrder(userId, product.id, shipping.id, product.minPrice);
    await this.seedPaidOrder(userId, product.id, shipping.id, product.minPrice);
  }

  private async seedPendingOrder(
    userId: string,
    productId: string,
    shippingMethodId: string,
    price: number | null,
  ) {
    const subtotal = Number(price ?? 65000000);
    const shippingAmount = 85000;

    const existing = await this.orderRepository.findPaginated(0, 1, {
      userId,
      status: 'pending',
    });
    if (existing[0].length) {
      return;
    }

    await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        productId,
        shippingMethodId,
        quantity: 1,
        subtotal,
        shippingAmount,
        amount: subtotal + shippingAmount,
        status: 'pending',
      }),
    );
  }

  private async seedPaidOrder(
    userId: string,
    productId: string,
    shippingMethodId: string,
    price: number | null,
  ) {
    const subtotal = Number(price ?? 65000000);
    const shippingAmount = 85000;
    const amount = subtotal + shippingAmount;

    const existingPayment = await this.paymentRepository.findByAuthority(
      'SEED-AUTH-0001',
    );
    if (existingPayment) {
      return;
    }

    const order = await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        productId,
        shippingMethodId,
        quantity: 1,
        subtotal,
        shippingAmount,
        amount,
        status: 'paid',
      }),
    );

    await this.paymentRepository.save(
      this.paymentRepository.create({
        orderId: order.id,
        gateway: 'zarinpal',
        authority: 'SEED-AUTH-0001',
        refId: 'SEED-REF-0001',
        amount,
        status: 'success',
        callbackUrl: 'https://didnegar.com/payment/callback',
      }),
    );
  }
}
