import { DataSource } from 'typeorm';
import { SellerOffer } from '../../offers/entities/seller-offer.entity.js';
import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../orders/repositories/order.repository.js';
import { PaymentRepository } from '../../payments/repositories/payment.repository.js';
import { ProductRepository } from '../../products/repositories/product.repository.js';
import { ShippingMethodRepository } from '../../shipping/repositories/shipping-method.repository.js';
import { UsersSeedService } from './users.seed.service.js';

@Injectable()
export class OrdersSeedService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly productRepository: ProductRepository,
    private readonly shippingMethodRepository: ShippingMethodRepository,
    private readonly usersSeedService: UsersSeedService,
  ) {}

  async seed() {
    const userId =
      await this.usersSeedService.findUserIdByUsername('09333333333');
    const product = await this.productRepository.findBySlug('galaxy-s24-ultra');
    const shipping =
      await this.shippingMethodRepository.findBySlug('mahex-cod');

    if (!userId || !product || !shipping) {
      return;
    }

    const offer = await this.dataSource
      .getRepository(SellerOffer)
      .findOne({
        where: { sku: 'SAM-S24U-256-BLK', seller: { slug: 'didnegar-shop' } },
      });
    if (!offer) return;
    await this.seedPendingOrder(userId, product.id, shipping.id, offer);
    await this.seedPaidOrder(userId, product.id, shipping.id, offer);
  }

  private async seedPendingOrder(
    userId: string,
    productId: string,
    shippingMethodId: string,
    offer: SellerOffer,
  ) {
    const subtotal = Number(offer.price);
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
        items: [
          {
            productId,
            offerId: offer.id,
            variantId: offer.variantId,
            sellerId: offer.sellerId,
            sku: offer.sku,
            quantity: 1,
            unitPrice: subtotal,
          },
        ],
        shippingMethodId,
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
    offer: SellerOffer,
  ) {
    const subtotal = Number(offer.price);
    const shippingAmount = 85000;
    const amount = subtotal + shippingAmount;

    const existingPayment =
      await this.paymentRepository.findByAuthority('SEED-AUTH-0001');
    if (existingPayment) {
      return;
    }

    const order = await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        items: [
          {
            productId,
            offerId: offer.id,
            variantId: offer.variantId,
            sellerId: offer.sellerId,
            sku: offer.sku,
            quantity: 1,
            unitPrice: subtotal,
          },
        ],
        shippingMethodId,
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
