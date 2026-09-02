import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository.js';
import { SubCategoryRepository } from './repositories/sub-category.repository.js';
import { ProductCategoryRepository } from './repositories/product-category.repository.js';
import { ProductRepository } from '../products/repositories/product.repository.js';

const SEED_CATEGORIES = [
  {
    slug: 'mobile',
    name: 'موبایل',
    legacyId: 1,
    subCategories: [
      { slug: 'phones', name: 'گوشی', legacyId: 1 },
      { slug: 'tablets', name: 'تبلت', legacyId: 2 },
    ],
  },
  {
    slug: 'accessories',
    name: 'لوازم جانبی',
    legacyId: 2,
    subCategories: [
      { slug: 'earbuds', name: 'هندزفری', legacyId: 3 },
      { slug: 'chargers', name: 'شارژر', legacyId: 4 },
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
export class CategoriesSeedService {
  private categoryMap = new Map<string, string>();
  private subCategoryMap = new Map<string, string>();

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async seedCatalog() {
    this.categoryMap.clear();
    this.subCategoryMap.clear();

    for (const category of SEED_CATEGORIES) {
      let categoryEntity = await this.categoryRepository.findBySlug(category.slug);
      if (!categoryEntity) {
        categoryEntity = await this.categoryRepository.save(
          this.categoryRepository.create({
            slug: category.slug,
            name: category.name,
            legacyId: category.legacyId,
            legacyTable: 'categories',
          }),
        );
      }
      this.categoryMap.set(category.slug, categoryEntity.id);

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
              legacyId: sub.legacyId,
              legacyTable: 'sub_categories',
            }),
          );
        }
        this.subCategoryMap.set(key, subEntity.id);
      }
    }
  }

  async seedProductLinks() {
    if (!this.categoryMap.size) {
      await this.seedCatalog();
    }

    for (const [productSlug, mapping] of Object.entries(PRODUCT_CATEGORY_MAP)) {
      const product = await this.productRepository.findBySlug(productSlug);
      if (!product) continue;

      const categoryId = this.categoryMap.get(mapping.category);
      const subCategoryId = this.subCategoryMap.get(
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
