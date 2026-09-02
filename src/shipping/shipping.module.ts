import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingMethod } from './entities/shipping-method.entity.js';
import { ShippingService } from './shipping.service.js';
import { ShippingController } from './shipping.controller.js';
import { ShippingSeedService } from './shipping.seed.service.js';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';
import { ProductsModule } from '../products/products.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingMethod]),
    ProductsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingSeedService, ShippingMethodRepository],
  exports: [ShippingService, ShippingMethodRepository],
})
export class ShippingModule {}
