import { Injectable, OnModuleInit } from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository.js';
import { SubCategoryRepository } from './repositories/sub-category.repository.js';
import { ProductCategoryRepository } from './repositories/product-category.repository.js';
import { ProductRepository } from '../products/repositories/product.repository.js';

const SEED_CATEGORIES = [
  {
    slug: 'mobile',
    name: 'موبایل',
    subCategories: [
      { slug: 'phones', name: 'گوشی' },
      { slug: 'tablets', name: 'تبلت' },
    ],
  },
  {
    slug: 'accessories',
    name: 'لوازم جانبی',
    subCategories: [
      { slug: 'earbuds', name: 'هندزفری' },
      { slug: 'chargers', name: 'شارژر' },
    ],
  },
] as const;

const PRODUCT_CATEGORY_MAP: Record<string, { category: string; sub: string }> =
  {
    'galaxy-s24-ultra': { category: 'mobile', sub: 'phones' },
    'iphone-15-pro': { category: 'mobile', sub: 'phones' },
    'redmi-note-13-pro': { category: 'mobile', sub: 'phones' },
    'galaxy-buds3-pro': { category: 'accessories', sub: 'earbuds' },
    'airpods-pro-2': { category: 'accessories', sub: 'earbuds' },
  };

@Injectable()
export class CategoriesSeedService implements OnModuleInit {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async onModuleInit() {
    const categoryMap = new Map<string, string>();
    const subCategoryMap = new Map<string, string>();

    for (const category of SEED_CATEGORIES) {
      let categoryEntity = await this.categoryRepository.findBySlug(category.slug);
      if (!categoryEntity) {
        categoryEntity = await this.categoryRepository.save(
          this.categoryRepository.create({
            slug: category.slug,
            name: category.name,
            legacyTable: 'categories',
          }),
        );
      }
      categoryMap.set(category.slug, categoryEntity.id);

      for (const sub of category.subCategories) {
        const key = `${category.slug}:${sub.slug}`;
        let subEntity = await this.subCategoryRepository.findByCategoryAndSlug(
          categoryEntity.id,
          sub.slug,
        );
        if (!subEntity) {
          subEntity = await this.subCategoryRepository.save(
            this.subCategoryRepository.create({
              categoryId: categoryEntity.id,
              slug: sub.slug,
              name: sub.name,
              legacyTable: 'sub_categories',
            }),
          );
        }
        subCategoryMap.set(key, subEntity.id);
      }
    }

    for (const [productSlug, mapping] of Object.entries(PRODUCT_CATEGORY_MAP)) {
      const product = await this.productRepository.findBySlug(productSlug);
      if (!product) continue;

      const categoryId = categoryMap.get(mapping.category);
      const subCategoryId = subCategoryMap.get(
        `${mapping.category}:${mapping.sub}`,
      );
      if (!categoryId || !subCategoryId) continue;

      const existing =
        await this.productCategoryRepository.findByProductCategorySubCategory(
          product.id,
          categoryId,
          subCategoryId,
        );
      if (existing) continue;

      await this.productCategoryRepository.save(
        this.productCategoryRepository.create({
          productId: product.id,
          categoryId,
          subCategoryId,
          isPrimary: true,
          position: 0,
        }),
      );
    }
  }
}
