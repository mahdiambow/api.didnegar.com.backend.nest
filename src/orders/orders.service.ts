import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { DataSource, EntityManager } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { OffersService } from '../offers/offers.service.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { calculateOrderAmounts } from '../shipping/dto/shipping.dto.js';
import { DepositsService } from '../deposits/deposits.service.js';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service.js';
import { AddressesService } from '../addresses/addresses.service.js';
import { PromotionsService } from '../promotions/promotions.service.js';
import {
  CreateOrderDto,
  OrderProductDto,
  OrderPriceDto,
} from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { toOrderResponse } from './dto/order-response.dto.js';
import { OrderRepository } from './repositories/order.repository.js';
import { Order } from './entities/order.entity.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly offersService: OffersService,
    private readonly shippingService: ShippingService,
    @Inject(forwardRef(() => DepositsService))
    private readonly depositsService: DepositsService,
    @Inject(forwardRef(() => ShoppingCartService))
    private readonly shoppingCartService: ShoppingCartService,
    private readonly addressesService: AddressesService,
    private readonly promotionsService: PromotionsService,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    type?: string;
    userId?: string;
    customerId?: string;
  }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.orderRepository.findPaginated(
      offset,
      limit,
      {
        status: query.status,
        type: query.type,
        userId: query.userId,
        customerId: query.customerId,
      },
    );

    return paginatedList(
      items.map((order) => toOrderResponse(order)),
      page,
      limit,
      total,
    );
  }

  /** لیست سفارش‌های خود کاربر لاگین‌شده */
  async findMine(
    userId: string,
    query: { page?: string | number; limit?: string | number; status?: string },
  ) {
    return this.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      userId,
      type: 'user',
    });
  }

  async create(userId: string, dto: CreateOrderDto) {
    const products = await this.resolveCheckoutProducts(userId, dto);
    const items = await this.resolveProducts(products);
    const address = await this.addressesService.resolveForUser(
      userId,
      dto.addressId,
    );
    const shippingMethod = await this.shippingService.resolveShippingMethod(
      dto.shippingMethodId,
    );
    const amounts = this.calculateAmounts(items, [shippingMethod]);
    const priced = this.applyPriceOverrides(amounts, dto.price);
    const paymentMethod = dto.paymentMethod ?? 'iBank';
    let payableAmount = priced.amount;
    let discountAmount = priced.discountAmount;
    let promotionId: string | null = null;

    const orderId = await this.dataSource.transaction(async (manager) => {
      await this.offersService.decrementStockForPurchase(items, manager);
      const id = await this.insertOrder(manager, {
        type: 'user',
        userId,
        customerId: null,
        items,
        addressId: address.id,
        shippingMethodIds: [shippingMethod.id],
        shippingMethodId: shippingMethod.id,
        subtotal: priced.subtotal,
        shippingAmount: priced.shippingAmount,
        discountAmount,
        amount: payableAmount,
        paymentMethod,
        promotionId: null,
      });

      if (dto.promotionCode?.trim()) {
        const applied = await this.promotionsService.applyToOrderInTransaction(
          manager,
          {
            userId,
            orderId: id,
            code: dto.promotionCode,
            orderAmount: payableAmount,
          },
        );
        discountAmount = applied.discountAmount;
        promotionId = applied.promotionId;
        payableAmount = applied.discountPrice;
        await manager.getRepository(Order).update(
          { id },
          {
            discountAmount,
            amount: payableAmount,
            promotionId,
          },
        );
      }

      await this.shoppingCartService.clear(userId, manager);
      return id;
    });

    const saved = await this.orderRepository.findById(orderId);
    const payment = await this.depositsService.requestPayment(
      userId,
      orderId,
      paymentMethod,
    );
    return toOrderResponse(saved!, {
      paymentUrl: payment.paymentUrl,
      paymentGateway: payment.gateway,
      creditApplied: payment.creditApplied,
      bankAmount: payment.bankAmount,
    });
  }

  /**
   * سفارش تلفنی — بدون User/سبد/درگاه؛ type=customer
   * داخل تراکنش بیرونی (مثلاً ثبت مشتری) صدا زده می‌شود.
   */
  async createCustomerOrderInTransaction(
    manager: EntityManager,
    data: {
      customerId: string;
      products: OrderProductDto[];
      shippingMethodId: string;
      paymentMethod?: string | null;
      price?: OrderPriceDto;
      promotionCode?: string | null;
    },
  ) {
    const items = await this.resolveProducts(data.products);
    const shippingMethod = await this.shippingService.resolveShippingMethod(
      data.shippingMethodId,
    );
    const amounts = this.calculateAmounts(items, [shippingMethod]);
    const priced = this.applyPriceOverrides(amounts, data.price);
    let payableAmount = priced.amount;
    let discountAmount = priced.discountAmount;
    let promotionId: string | null = null;

    await this.offersService.decrementStockForPurchase(items, manager);
    const orderId = await this.insertOrder(manager, {
      type: 'customer',
      userId: null,
      customerId: data.customerId,
      items,
      addressId: null,
      shippingMethodIds: [shippingMethod.id],
      shippingMethodId: shippingMethod.id,
      subtotal: priced.subtotal,
      shippingAmount: priced.shippingAmount,
      discountAmount,
      amount: payableAmount,
      paymentMethod: data.paymentMethod ?? null,
      promotionId: null,
    });

    if (data.promotionCode?.trim()) {
      const applied = await this.promotionsService.applyToOrderInTransaction(
        manager,
        {
          customerId: data.customerId,
          orderId,
          code: data.promotionCode,
          orderAmount: payableAmount,
        },
      );
      discountAmount = applied.discountAmount;
      promotionId = applied.promotionId;
      payableAmount = applied.discountPrice;
      await manager.getRepository(Order).update(
        { id: orderId },
        {
          discountAmount,
          amount: payableAmount,
          promotionId,
        },
      );
    }

    return orderId;
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

      const amounts = this.calculateAmounts(items, [shippingMethod]);
      order.items = items as typeof order.items;
      order.shippingMethodId = shippingMethod.id;
      order.shippingMethodIds = [shippingMethod.id];
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

    const updated = await this.dataSource.transaction(async (manager) => {
      return manager.getRepository(Order).save(order);
    });
    const saved = await this.orderRepository.findById(updated.id);
    return toOrderResponse(saved!);
  }

  private async resolveCheckoutProducts(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderProductDto[]> {
    const cart = await this.shoppingCartService.get(userId);
    if (cart.items.length > 0) {
      return cart.items.map((item) => ({
        offerId: item.offerId,
        quantity: item.quantity,
      }));
    }

    if (dto.products?.length) {
      return dto.products;
    }

    throw new ApiException(
      'CART_EMPTY',
      'سبد خرید خالی است؛ ابتدا محصول به سبد اضافه کنید',
      HttpStatus.BAD_REQUEST,
    );
  }

  private async resolveProducts(products: OrderProductDto[]) {
    return Promise.all(
      products.map((item) =>
        this.offersService.resolvePurchasable(item.offerId, item.quantity ?? 1),
      ),
    );
  }

  private async insertOrder(
    manager: EntityManager,
    data: {
      type: 'user' | 'customer';
      userId: string | null;
      customerId: string | null;
      items: Array<{
        offerId: string;
        productId: string;
        attributes: Record<string, string>;
        sellerId: string | null;
        sku: string | null;
        quantity: number;
        unitPrice: number;
      }>;
      addressId: string | null;
      shippingMethodIds: string[];
      shippingMethodId: string;
      subtotal: number;
      shippingAmount: number;
      discountAmount: number;
      amount: number;
      paymentMethod: string | null;
      promotionId: string | null;
    },
  ) {
    const orderRepo = manager.getRepository(Order);
    const order = await orderRepo.save(
      orderRepo.create({
        type: data.type,
        userId: data.userId,
        customerId: data.customerId,
        addressId: data.addressId,
        items: data.items,
        shippingMethodId: data.shippingMethodId,
        shippingMethodIds: data.shippingMethodIds,
        subtotal: data.subtotal,
        shippingAmount: data.shippingAmount,
        discountAmount: data.discountAmount,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        promotionId: data.promotionId,
        // سفارش تلفنی بدون درگاه → مستقیم در حال پردازش
        status: data.type === 'customer' ? 'processing' : 'pending',
      }),
    );
    return order.id;
  }

  private applyPriceOverrides(
    amounts: {
      subtotal: number;
      shippingAmount: number;
      payableAmount: number;
    },
    price?: OrderPriceDto,
  ) {
    if (!price) {
      return {
        subtotal: amounts.subtotal,
        shippingAmount: amounts.shippingAmount,
        discountAmount: 0,
        amount: amounts.payableAmount,
      };
    }

    const subtotal =
      price.price !== undefined ? Number(price.price) : amounts.subtotal;
    const shippingAmount = amounts.shippingAmount;
    const discountAmount =
      price.discountAmount !== undefined ? Number(price.discountAmount) : 0;
    const basePayable =
      price.price !== undefined
        ? subtotal + shippingAmount
        : amounts.payableAmount;
    const amount =
      price.totalPrice !== undefined
        ? Number(price.totalPrice)
        : Math.max(0, basePayable - discountAmount);

    return { subtotal, shippingAmount, discountAmount, amount };
  }

  private calculateAmounts(
    items: { unitPrice: number; quantity: number }[],
    shippingMethods: { price: number; isCod: boolean }[],
  ) {
    const subtotal = items.reduce(
      (sum, item) =>
        sum.plus(new BigNumber(item.unitPrice).times(item.quantity)),
      new BigNumber(0),
    );
    const shippingAmount = shippingMethods.reduce(
      (sum, method) => sum.plus(new BigNumber(method.price)),
      new BigNumber(0),
    );
    const allCod = shippingMethods.every((method) => method.isCod);
    return calculateOrderAmounts(
      subtotal.toNumber(),
      1,
      shippingAmount.toNumber(),
      allCod,
    );
  }
}
