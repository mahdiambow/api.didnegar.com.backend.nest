import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { OffersModule } from '../offers/offers.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { ShoppingCartItem } from './entities/shopping-cart-item.entity.js';
import { ShoppingCart } from './entities/shopping-cart.entity.js';
import { ShoppingCartController } from './shopping-cart.controller.js';
import { ShoppingCartService } from './shopping-cart.service.js';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => OffersModule),
    forwardRef(() => OrdersModule),
    TypeOrmModule.forFeature([ShoppingCart, ShoppingCartItem]),
  ],
  controllers: [ShoppingCartController],
  providers: [ShoppingCartService],
  exports: [ShoppingCartService],
})
export class ShoppingCartModule {}
