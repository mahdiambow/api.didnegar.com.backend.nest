import { Module, forwardRef } from '@nestjs/common';
import { OffersModule } from '../offers/offers.module.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { ShoppingCartModule } from '../shopping-cart/shopping-cart.module.js';
import { CheckoutAmountService } from './checkout-amount.service.js';

@Module({
  imports: [
    forwardRef(() => OffersModule),
    forwardRef(() => ShippingModule),
    forwardRef(() => ShoppingCartModule),
  ],
  providers: [CheckoutAmountService],
  exports: [CheckoutAmountService],
})
export class CheckoutAmountModule {}
