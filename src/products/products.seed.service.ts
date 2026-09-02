import { Injectable, OnModuleInit } from '@nestjs/common';
import { BrandRepository } from './repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';

const FAKE_BRANDS = [
  { slug: 'samsung', name: 'سامسونگ', legacyId: 1 },
  { slug: 'apple', name: 'اپل', legacyId: 2 },
  { slug: 'xiaomi', name: 'شیائومی', legacyId: 3 },
] as const;

const FAKE_PRODUCTS = [
  {
    slug: 'galaxy-s24-ultra',
    name: 'گوشی Galaxy S24 Ultra',
    brandSlug: 'samsung',
    sku: 'SAM-S24U-256',
    shortDescription: 'پرچمدار سامسونگ با قلم S Pen',
    minPrice: 65000000,
    maxPrice: 72000000,
    stockQuantity: 25,
    stockStatus: 'instock',
    isOnSale: true,
    averageRating: 4.7,
    ratingCount: 128,
    totalSales: 340,
  },
  {
    slug: 'iphone-15-pro',
    name: 'آیفون 15 Pro',
    brandSlug: 'apple',
    sku: 'APL-IP15P-256',
    shortDescription: 'پرچمدار اپل با چیپ A17 Pro',
    minPrice: 78000000,
    maxPrice: 85000000,
    stockQuantity: 12,
    stockStatus: 'instock',
    isOnSale: false,
    averageRating: 4.9,
    ratingCount: 256,
    totalSales: 510,
  },
  {
    slug: 'redmi-note-13-pro',
    name: 'Redmi Note 13 Pro',
    brandSlug: 'xiaomi',
    sku: 'XIA-RN13P-128',
    shortDescription: 'میان‌رده محبوب شیائومی',
    minPrice: 18500000,
    maxPrice: 21000000,
    stockQuantity: 80,
    stockStatus: 'instock',
    isOnSale: true,
    averageRating: 4.4,
    ratingCount: 89,
    totalSales: 920,
  },
  {
    slug: 'galaxy-buds3-pro',
    name: 'Galaxy Buds3 Pro',
    brandSlug: 'samsung',
    sku: 'SAM-BUDS3P',
    shortDescription: 'ایرباد نویزکنسلینگ سامسونگ',
    minPrice: 9800000,
    maxPrice: 11500000,
    stockQuantity: 40,
    stockStatus: 'instock',
    isOnSale: false,
    averageRating: 4.5,
    ratingCount: 45,
    totalSales: 180,
  },
  {
    slug: 'airpods-pro-2',
    name: 'AirPods Pro 2',
    brandSlug: 'apple',
    sku: 'APL-APP2',
    shortDescription: 'ایرباد حرفه‌ای اپل',
    minPrice: 13500000,
    maxPrice: 15000000,
    stockQuantity: 30,
    stockStatus: 'instock',
    isOnSale: true,
    averageRating: 4.8,
    ratingCount: 312,
    totalSales: 640,
  },
] as const;

@Injectable()
export class ProductsSeedService implements OnModuleInit {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async onModuleInit() {
    const brandMap = new Map<string, string>();

    for (const brand of FAKE_BRANDS) {
      const existing = await this.brandRepository.findBySlug(brand.slug);
      if (existing) {
        brandMap.set(brand.slug, existing.id);
        continue;
      }

      const created = await this.brandRepository.save(
        this.brandRepository.create({
          slug: brand.slug,
          name: brand.name,
          legacyId: brand.legacyId,
          legacyTable: 'brands',
        }),
      );
      brandMap.set(brand.slug, created.id);
    }

    for (const [index, product] of FAKE_PRODUCTS.entries()) {
      const existing = await this.productRepository.findBySlug(product.slug);
      if (existing) {
        continue;
      }

      await this.productRepository.save(
        this.productRepository.create({
          legacyId: index + 1,
          legacyTable: 'products',
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          status: 'publish',
          sku: product.sku,
          brandId: brandMap.get(product.brandSlug) ?? null,
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus,
          isOnSale: product.isOnSale,
          averageRating: product.averageRating,
          ratingCount: product.ratingCount,
          totalSales: product.totalSales,
        }),
      );
    }
  }
}
