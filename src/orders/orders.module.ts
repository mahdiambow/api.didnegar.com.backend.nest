import { OffersModule } from '../offers/offers.module.js';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrdersService } from './orders.service.js';
import { CheckoutAmountModule } from './checkout-amount.module.js';
import { OrdersController } from './orders.controller.js';
import { OrderRepository } from './repositories/order.repository.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { DepositsModule } from '../deposits/deposits.module.js';
import { ShoppingCartModule } from '../shopping-cart/shopping-cart.module.js';
import { AddressesModule } from '../addresses/addresses.module.js';
import { PromotionsModule } from '../promotions/promotions.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    forwardRef(() => OffersModule),
    forwardRef(() => ShippingModule),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
    forwardRef(() => DepositsModule),
    forwardRef(() => ShoppingCartModule),
    forwardRef(() => AddressesModule),
    forwardRef(() => PromotionsModule),
    CheckoutAmountModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
  exports: [OrdersService, OrderRepository, CheckoutAmountModule],
})
export class OrdersModule {}
