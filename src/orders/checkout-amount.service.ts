import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { OffersService } from '../offers/offers.service.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { calculateOrderAmounts } from '../shipping/dto/shipping.dto.js';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service.js';

export type CheckoutProductInput = {
  offerId: string;
  quantity?: number;
};

export type CheckoutPayable = {
  subtotal: number;
  shippingAmount: number;
  payableAmount: number;
};

/**
 * محاسبه مبلغ سفارش سمت سرور (offer + shipping) —
 * جدا از OrdersService تا وابستگی دایره‌ای با Promotions نداشته باشد.
 */
@Injectable()
export class CheckoutAmountService {
  constructor(
    private readonly offersService: OffersService,
    private readonly shippingService: ShippingService,
    @Inject(forwardRef(() => ShoppingCartService))
    private readonly shoppingCartService: ShoppingCartService,
  ) {}

  async computePayable(
    userId: string | null,
    data: {
      shippingMethodId: string;
      products?: CheckoutProductInput[];
      requireProducts?: boolean;
    },
  ): Promise<CheckoutPayable> {
    const products = await this.resolveProducts(
      userId,
      data.products,
      data.requireProducts === true,
    );
    const items = await Promise.all(
      products.map((item) =>
        this.offersService.resolvePurchasable(
          item.offerId,
          item.quantity ?? 1,
        ),
      ),
    );
    const shippingMethod = await this.shippingService.resolveShippingMethod(
      data.shippingMethodId,
    );
    return this.calculateAmounts(items, [shippingMethod]);
  }

  private async resolveProducts(
    userId: string | null,
    products: CheckoutProductInput[] | undefined,
    requireProducts: boolean,
  ): Promise<CheckoutProductInput[]> {
    if (products?.length) return products;

    if (requireProducts || !userId) {
      throw new ApiException(
        'PRODUCTS_REQUIRED',
        'لیست محصولات برای محاسبه مبلغ الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cart = await this.shoppingCartService.get(userId);
    if (cart.items.length > 0) {
      return cart.items.map((item) => ({
        offerId: item.offerId,
        quantity: item.quantity,
      }));
    }

    throw new ApiException(
      'CART_EMPTY',
      'سبد خرید خالی است؛ ابتدا محصول به سبد اضافه کنید یا products بفرستید',
      HttpStatus.BAD_REQUEST,
    );
  }

  private calculateAmounts(
    items: { unitPrice: number; quantity: number }[],
    shippingMethods: { price: number; isCod: boolean }[],
  ): CheckoutPayable {
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
    const amounts = calculateOrderAmounts(
      subtotal.toNumber(),
      1,
      shippingAmount.toNumber(),
      allCod,
    );
    return {
      subtotal: amounts.subtotal,
      shippingAmount: amounts.shippingAmount,
      payableAmount: amounts.payableAmount,
    };
  }
}
