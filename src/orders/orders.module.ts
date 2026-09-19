import { OffersModule } from '../offers/offers.module.js';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { OrderRepository } from './repositories/order.repository.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { UserAddress } from '../users/entities/user-address.entity.js';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity.js';
import { ShoppingCartItem } from '../shopping-cart/entities/shopping-cart-item.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      UserAddress,
      ShoppingCart,
      ShoppingCartItem,
    ]),
    forwardRef(() => OffersModule),
    forwardRef(() => ShippingModule),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
  exports: [OrdersService, OrderRepository],
})
export class OrdersModule {}
