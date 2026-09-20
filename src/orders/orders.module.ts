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
import { DepositsModule } from '../deposits/deposits.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    forwardRef(() => OffersModule),
    forwardRef(() => ShippingModule),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
    forwardRef(() => DepositsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
  exports: [OrdersService, OrderRepository],
})
export class OrdersModule {}
