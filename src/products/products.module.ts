import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { ProductStock } from './entities/product-stock.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsPricingController } from './products-pricing.controller.js';
import { ProductPricingService } from './product-pricing.service.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductStockRepository } from './repositories/product-stock.repository.js';
import { AttributesModule } from '../attributes/attributes.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { BrandsModule } from '../brands/brands.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { SellersModule } from '../sellers/sellers.module.js';
import { ShippingMethod } from '../shipping/entities/shipping-method.entity.js';
import { ShippingMethodRepository } from '../shipping/repositories/shipping-method.repository.js';
import { SellerOffer } from '../offers/entities/seller-offer.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductStock,
      ShippingMethod,
      SellerOffer,
    ]),
    BrandsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => CategoriesModule),
    AttributesModule,
    SellersModule,
  ],
  controllers: [ProductsController, ProductsPricingController],
  providers: [
    ProductsService,
    ProductPricingService,
    ProductRepository,
    ProductStockRepository,
    ShippingMethodRepository,
  ],
  exports: [ProductsService, ProductRepository, ProductStockRepository],
})
export class ProductsModule {}
