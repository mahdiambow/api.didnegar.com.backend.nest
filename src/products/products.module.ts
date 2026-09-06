import { OffersModule } from '../offers/offers.module.js';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity.js';
import { Product } from './entities/product.entity.js';
import { ProductVariant } from './entities/product-variant.entity.js';
import { ProductVariantAttribute } from './entities/product-variant-attribute.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsPricingController } from './products-pricing.controller.js';
import { ProductsSeedService } from './products.seed.service.js';
import { ProductPricingService } from './product-pricing.service.js';
import { BrandRepository } from './repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { AttributesModule } from '../attributes/attributes.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CategoriesModule } from '../categories/categories.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      Product,
      ProductVariant,
      ProductVariantAttribute,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => CategoriesModule),
    AttributesModule,
    OffersModule,
  ],
  controllers: [ProductsController, ProductsPricingController],
  providers: [
    ProductsService,
    ProductPricingService,
    ProductsSeedService,
    BrandRepository,
    ProductRepository,
  ],
  exports: [
    ProductsService,
    ProductsSeedService,
    ProductRepository,
    BrandRepository,
  ],
})
export class ProductsModule {}
