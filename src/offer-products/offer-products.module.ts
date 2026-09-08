import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { ProductsModule } from '../products/products.module.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { SellerOffer } from '../offers/entities/seller-offer.entity.js';
import { OfferProduct } from './entities/offer-product.entity.js';
import { OfferProductsController } from './offer-products.controller.js';
import { OfferProductsService } from './offer-products.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfferProduct, Seller, SellerOffer]),
    forwardRef(() => AuthModule),
    forwardRef(() => CategoriesModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [OfferProductsController],
  providers: [OfferProductsService],
  exports: [OfferProductsService],
})
export class OfferProductsModule {}
