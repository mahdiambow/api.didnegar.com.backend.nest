import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity.js';
import { SubCategory } from './entities/sub-category.entity.js';
import { ProductCategory } from './entities/product-category.entity.js';
import { CategoriesService } from './categories.service.js';
import {
  CategoriesController,
  SubCategoriesController,
  ProductCategoriesController,
} from './categories.controller.js';
import { CategoriesSeedService } from './categories.seed.service.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { SubCategoryRepository } from './repositories/sub-category.repository.js';
import { ProductCategoryRepository } from './repositories/product-category.repository.js';
import { ProductsModule } from '../products/products.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, SubCategory, ProductCategory]),
    forwardRef(() => ProductsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [
    CategoriesController,
    SubCategoriesController,
    ProductCategoriesController,
  ],
  providers: [
    CategoriesService,
    CategoriesSeedService,
    CategoryRepository,
    SubCategoryRepository,
    ProductCategoryRepository,
  ],
  exports: [CategoriesService, ProductCategoryRepository],
})
export class CategoriesModule {}
