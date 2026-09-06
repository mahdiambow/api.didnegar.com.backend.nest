import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import { SellerOffer } from './entities/seller-offer.entity.js';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([SellerOffer, Seller, ProductVariant]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService, TypeOrmModule],
})
export class OffersModule {}
