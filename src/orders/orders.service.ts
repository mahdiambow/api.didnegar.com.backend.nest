import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { calculateOrderAmounts } from '../shipping/dto/shipping.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { toOrderResponse } from './dto/order-response.dto.js';
import { OrderRepository } from './repositories/order.repository.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly shippingService: ShippingService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (product.status !== 'publish') {
      throw new ApiException(
        'PRODUCT_NOT_AVAILABLE',
        'محصول برای خرید در دسترس نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    const shippingMethod = await this.shippingService.resolveShippingMethod(
      dto.shippingMethodId,
    );

    const quantity = dto.quantity ?? 1;
    const unitPrice = Number(product.minPrice ?? product.maxPrice ?? 0);

    if (unitPrice <= 0) {
      throw new ApiException(
        'PRODUCT_PRICE_INVALID',
        'قیمت محصول تعریف نشده است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amounts = calculateOrderAmounts(
      unitPrice,
      quantity,
      Number(shippingMethod.price),
      shippingMethod.isCod,
    );

    const order = await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        productId: product.id,
        shippingMethodId: shippingMethod.id,
        quantity,
        subtotal: amounts.subtotal,
        shippingAmount: amounts.shippingAmount,
        amount: amounts.payableAmount,
        status: 'pending',
      }),
    );

    const saved = await this.orderRepository.findById(order.id);
    return toOrderResponse(saved!);
  }

  async findOne(id: string, userId: string) {
    const order = await this.orderRepository.findByIdForUser(id, userId);
    if (!order) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        'سفارش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toOrderResponse(order);
  }
}
