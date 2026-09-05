import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { calculateOrderAmounts } from '../shipping/dto/shipping.dto.js';
import { CreateOrderDto, OrderProductDto } from './dto/create-order.dto.js';
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

    return paginatedList(items.map(toOrderResponse), page, limit, total);
  }

  async create(userId: string, dto: CreateOrderDto) {
    const items = await this.resolveProducts(dto.products);
    const shippingMethod = await this.shippingService.resolveShippingMethod(
      dto.shippingMethodId,
    );
    const amounts = this.calculateAmounts(items, shippingMethod);

    const order = await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        items,
        shippingMethodId: shippingMethod.id,
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
      dto.products !== undefined || dto.shippingMethodId !== undefined;

    const hasManualAmounts =
      dto.subtotal !== undefined &&
      dto.shippingAmount !== undefined &&
      dto.amount !== undefined;

    if (shouldRecalculate) {
      const items =
        dto.products !== undefined
          ? await this.resolveProducts(dto.products)
          : order.items;

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

      const amounts = this.calculateAmounts(items, shippingMethod);

      order.items = this.orderRepository.create({ items }).items;
      order.shippingMethodId = shippingMethod.id;

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

  private async resolveProducts(products: OrderProductDto[]) {
    return Promise.all(
      products.map(async (item) => {
        const product = await this.productRepository.findById(item.productId);
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
        const unitPrice = Number(product.minPrice ?? product.maxPrice ?? 0);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new ApiException(
            'PRODUCT_PRICE_INVALID',
            'قیمت محصول تعریف نشده است',
            HttpStatus.BAD_REQUEST,
          );
        }
        return {
          productId: product.id,
          quantity: item.quantity ?? 1,
          unitPrice,
        };
      }),
    );
  }

  private calculateAmounts(
    items: { unitPrice: number; quantity: number }[],
    shippingMethod: { price: number; isCod: boolean },
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    return calculateOrderAmounts(
      subtotal,
      1,
      Number(shippingMethod.price),
      shippingMethod.isCod,
    );
  }
}
