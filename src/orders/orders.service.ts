import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { calculateOrderAmounts } from '../shipping/dto/shipping.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { toOrderResponse } from './dto/order-response.dto.js';
import { OrderRepository } from './repositories/order.repository.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly shippingService: ShippingService,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    userId?: string;
  }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.orderRepository.findPaginated(
      offset,
      limit,
      {
        status: query.status,
        userId: query.userId,
      },
    );

    return paginatedList(
      items.map(toOrderResponse),
      page,
      limit,
      total,
    );
  }

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
    const amounts = this.calculateAmounts(product, shippingMethod, quantity);

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

  async findOneAdmin(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        'سفارش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toOrderResponse(order);
  }

  async updateAdmin(id: string, dto: UpdateOrderDto) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        'سفارش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const shouldRecalculate =
      dto.productId !== undefined ||
      dto.shippingMethodId !== undefined ||
      dto.quantity !== undefined;

    const hasManualAmounts =
      dto.subtotal !== undefined &&
      dto.shippingAmount !== undefined &&
      dto.amount !== undefined;

    if (shouldRecalculate) {
      const product = await this.productRepository.findById(
        dto.productId ?? order.productId,
      );
      if (!product) {
        throw new ApiException(
          'PRODUCT_NOT_FOUND',
          'محصول یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }

      const shippingMethodId =
        dto.shippingMethodId !== undefined
          ? dto.shippingMethodId
          : order.shippingMethodId;

      let shippingMethod = null;
      if (shippingMethodId) {
        shippingMethod =
          await this.shippingService.resolveShippingMethod(shippingMethodId);
      } else if (order.shippingMethod) {
        shippingMethod = order.shippingMethod;
      }

      if (!shippingMethod) {
        throw new ApiException(
          'SHIPPING_METHOD_NOT_FOUND',
          'روش ارسال یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }

      const quantity = dto.quantity ?? order.quantity;
      const amounts = this.calculateAmounts(product, shippingMethod, quantity);

      order.productId = product.id;
      order.shippingMethodId = shippingMethod.id;
      order.quantity = quantity;

      if (!hasManualAmounts) {
        order.subtotal = amounts.subtotal;
        order.shippingAmount = amounts.shippingAmount;
        order.amount = amounts.payableAmount;
      }
    }

    if (dto.status !== undefined) {
      order.status = dto.status;
    }

    if (hasManualAmounts) {
      order.subtotal = dto.subtotal!;
      order.shippingAmount = dto.shippingAmount!;
      order.amount = dto.amount!;
    } else {
      if (dto.subtotal !== undefined) order.subtotal = dto.subtotal;
      if (dto.shippingAmount !== undefined) {
        order.shippingAmount = dto.shippingAmount;
      }
      if (dto.amount !== undefined) order.amount = dto.amount;
    }

    const updated = await this.orderRepository.save(order);
    const saved = await this.orderRepository.findById(updated.id);
    return toOrderResponse(saved!);
  }

  private calculateAmounts(
    product: { minPrice: number | null; maxPrice: number | null },
    shippingMethod: { price: number; isCod: boolean },
    quantity: number,
  ) {
    const unitPrice = Number(product.minPrice ?? product.maxPrice ?? 0);

    if (unitPrice <= 0) {
      throw new ApiException(
        'PRODUCT_PRICE_INVALID',
        'قیمت محصول تعریف نشده است',
        HttpStatus.BAD_REQUEST,
      );
    }

    return calculateOrderAmounts(
      unitPrice,
      quantity,
      Number(shippingMethod.price),
      shippingMethod.isCod,
    );
  }
}
