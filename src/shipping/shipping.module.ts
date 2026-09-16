import { OffersModule } from '../offers/offers.module.js';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingMethod } from './entities/shipping-method.entity.js';
import { ShippingService } from './shipping.service.js';
import { ShippingController } from './shipping.controller.js';
import { ShippingSeedService } from './shipping.seed.service.js';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingMethod]),
    forwardRef(() => OffersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingSeedService, ShippingMethodRepository],
  exports: [ShippingService, ShippingSeedService, ShippingMethodRepository],
})
export class ShippingModule {}
