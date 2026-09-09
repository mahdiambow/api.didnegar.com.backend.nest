import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentCategory } from './entities/parent-category.entity.js';
import { Category } from './entities/category.entity.js';
import { SubCategory } from './entities/sub-category.entity.js';
import { ProductCategory } from './entities/product-category.entity.js';
import { CategoriesService } from './categories.service.js';
import {
  ParentCategoriesController,
  CategoriesController,
  SubCategoriesController,
  ProductCategoriesController,
} from './categories.controller.js';
import { CategoriesSeedService } from './categories.seed.service.js';
import { ParentCategoryRepository } from './repositories/parent-category.repository.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { SubCategoryRepository } from './repositories/sub-category.repository.js';
import { ProductCategoryRepository } from './repositories/product-category.repository.js';
import { ProductsModule } from '../products/products.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentCategory,
      Category,
      SubCategory,
      ProductCategory,
    ]),
    forwardRef(() => ProductsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [
    ParentCategoriesController,
    CategoriesController,
    SubCategoriesController,
    ProductCategoriesController,
  ],
  providers: [
    CategoriesService,
    CategoriesSeedService,
    ParentCategoryRepository,
    CategoryRepository,
    SubCategoryRepository,
    ProductCategoryRepository,
  ],
  exports: [CategoriesService, CategoriesSeedService, ProductCategoryRepository],
})
export class CategoriesModule {}
