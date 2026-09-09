import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { OffersService } from '../offers/offers.service.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { calculateOrderAmounts } from '../shipping/dto/shipping.dto.js';
import { ProductStockRepository } from '../products/repositories/product-stock.repository.js';
import { CreateOrderDto, OrderProductDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { toOrderResponse } from './dto/order-response.dto.js';
import { OrderRepository } from './repositories/order.repository.js';
import { Order } from '../payments/entities/order.entity.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly offersService: OffersService,
    private readonly shippingService: ShippingService,
    private readonly productStockRepository: ProductStockRepository,
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

    // فقط ردیف‌های stock کم می‌شوند (اتمیک) — جدول products قفل نمی‌شود
    const orderId = await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const offerOk = await this.offersService.tryDecrementStock(
          item.offerId,
          item.quantity,
          manager,
        );
        if (!offerOk) {
          throw new ApiException(
            'OFFER_UNAVAILABLE',
            'پیشنهاد فروش یا موجودی موردنیاز در دسترس نیست',
            HttpStatus.CONFLICT,
          );
        }

        const productOk = await this.productStockRepository.tryDecrement(
          item.productId,
          item.quantity,
          manager,
        );
        if (!productOk) {
          throw new ApiException(
            'PRODUCT_OUT_OF_STOCK',
            'موجودی محصول کافی نیست',
            HttpStatus.CONFLICT,
          );
        }
      }

      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.save(
        orderRepo.create({
          userId,
          items,
          shippingMethodId: shippingMethod.id,
          subtotal: amounts.subtotal,
          shippingAmount: amounts.shippingAmount,
          amount: amounts.payableAmount,
          status: 'pending',
        }),
      );
      return order.id;
    });

    const saved = await this.orderRepository.findById(orderId);
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
          'SHIPPING_METHOD_REQUIRED',
          'روش ارسال مشخص نیست',
          HttpStatus.BAD_REQUEST,
        );
      }

      const amounts = this.calculateAmounts(items, shippingMethod);
      order.items = items as typeof order.items;
      order.shippingMethodId = shippingMethod.id;
      if (!hasManualAmounts) {
        order.subtotal = amounts.subtotal;
        order.shippingAmount = amounts.shippingAmount;
        order.amount = amounts.payableAmount;
      }
    }

    if (hasManualAmounts) {
      order.subtotal = dto.subtotal!;
      order.shippingAmount = dto.shippingAmount!;
      order.amount = dto.amount!;
    } else {
      if (dto.subtotal !== undefined) {
        order.subtotal = dto.subtotal;
      }
      if (dto.shippingAmount !== undefined) {
        order.shippingAmount = dto.shippingAmount;
      }
      if (dto.amount !== undefined) {
        order.amount = dto.amount;
      }
    }

    if (dto.status !== undefined) {
      order.status = dto.status;
    }

    const updated = await this.orderRepository.save(order);
    const saved = await this.orderRepository.findById(updated.id);
    return toOrderResponse(saved!);
  }

  private async resolveProducts(products: OrderProductDto[]) {
    return Promise.all(
      products.map((item) =>
        this.offersService.resolvePurchasable(item.offerId, item.quantity ?? 1),
      ),
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
