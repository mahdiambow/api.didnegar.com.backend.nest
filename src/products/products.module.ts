import { OffersModule } from '../offers/offers.module.js';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { ProductStock } from './entities/product-stock.entity.js';
import { ProductVariant } from './entities/product-variant.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsPricingController } from './products-pricing.controller.js';
import { ProductsSeedService } from './products.seed.service.js';
import { ProductPricingService } from './product-pricing.service.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductStockRepository } from './repositories/product-stock.repository.js';
import { AttributesModule } from '../attributes/attributes.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BrandsModule } from '../brands/brands.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { SellersModule } from '../sellers/sellers.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductStock, ProductVariant]),
    BrandsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => CategoriesModule),
    AttributesModule,
    forwardRef(() => OffersModule),
    SellersModule,
  ],
  controllers: [ProductsController, ProductsPricingController],
  providers: [
    ProductsService,
    ProductPricingService,
    ProductsSeedService,
    ProductRepository,
    ProductStockRepository,
  ],
  exports: [
    ProductsService,
    ProductsSeedService,
    ProductRepository,
    ProductStockRepository,
  ],
})
export class ProductsModule {}
