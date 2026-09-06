import { DataSource } from 'typeorm';
import { SellerOffer } from '../offers/entities/seller-offer.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { Injectable } from '@nestjs/common';
import { BrandRepository } from './repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { AttributeValueRepository } from '../attributes/repositories/attribute-value.repository.js';
import { AttributeRepository } from '../attributes/repositories/attribute.repository.js';

const FAKE_BRANDS = [
  {
    slug: 'samsung',
    name: 'سامسونگ',
    legacyId: 1,
    description: 'برند کره‌ای لوازم الکترونیک',
  },
  {
    slug: 'apple',
    name: 'اپل',
    legacyId: 2,
    description: 'برند آمریکایی محصولات دیجیتال',
  },
  {
    slug: 'xiaomi',
    name: 'شیائومی',
    legacyId: 3,
    description: 'برند چینی گجت و موبایل',
  },
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

const SEED_VARIANT_ATTRIBUTE_LINKS = [
  { attributeName: 'storage', valueSlug: '256gb' },
  { attributeName: 'storage', valueSlug: '512gb' },
  { attributeName: 'color', valueSlug: 'black' },
  { attributeName: 'color', valueSlug: 'titanium' },
] as const;

const SEED_VARIANTS = [
  {
    productSlug: 'galaxy-s24-ultra',
    sku: 'SAM-S24U-256-BLK',
    minPrice: 65000000,
    maxPrice: 72000000,
    stockQuantity: 10,
    description: 'Galaxy S24 Ultra 256GB مشکی',
    attributes: ['256gb', 'black'],
  },
  {
    productSlug: 'galaxy-s24-ultra',
    sku: 'SAM-S24U-512-BLK',
    minPrice: 72000000,
    maxPrice: 79000000,
    stockQuantity: 5,
    description: 'Galaxy S24 Ultra 512GB مشکی',
    attributes: ['512gb', 'black'],
  },
  {
    productSlug: 'iphone-15-pro',
    sku: 'APL-IP15P-256-TIT',
    minPrice: 78000000,
    maxPrice: 85000000,
    stockQuantity: 8,
    description: 'آیفون 15 Pro 256GB تیتانیوم',
    attributes: ['256gb', 'titanium'],
  },
] as const;

@Injectable()
export class ProductsSeedService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly brandRepository: BrandRepository,
    private readonly productRepository: ProductRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
    private readonly attributeRepository: AttributeRepository,
  ) {}

  async seed() {
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
          description: brand.description,
          isActive: true,
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
          brandId: brandMap.get(product.brandSlug) ?? null,
          averageRating: product.averageRating,
          ratingCount: product.ratingCount,
          totalSales: product.totalSales,
        }),
      );
    }

    const attributeMap = new Map<string, string>();
    for (const link of SEED_VARIANT_ATTRIBUTE_LINKS) {
      const key = `${link.attributeName}:${link.valueSlug}`;
      if (attributeMap.has(key)) continue;

      const attribute = await this.attributeRepository.findByName(
        link.attributeName,
      );
      if (!attribute) continue;

      const attributeValue =
        await this.attributeValueRepository.findByAttributeAndSlug(
          attribute.id,
          link.valueSlug,
        );
      if (!attributeValue) continue;

      attributeMap.set(link.valueSlug, attributeValue.id);
    }

    const seller = await this.dataSource
      .getRepository(Seller)
      .findOneBy({ slug: 'didnegar-shop' });
    for (const seed of SEED_VARIANTS) {
      const product = await this.productRepository.findBySlug(seed.productSlug);
      const ids = seed.attributes.map((slug) => attributeMap.get(slug));
      if (!product || ids.some((id) => !id)) continue;
      const attributes = Object.fromEntries(
        seed.attributes.map((slug) => {
          const link = SEED_VARIANT_ATTRIBUTE_LINKS.find(
            (item) => item.valueSlug === slug,
          )!;
          return [link.attributeName, slug];
        }),
      );
      if (seller) {
        const offers = this.dataSource.getRepository(SellerOffer);
        if (
          !(await offers.existsBy({
            sellerId: seller.id,
            sku: seed.sku,
          }))
        ) {
          await offers.save(
            offers.create({
              sellerId: seller.id,
              productId: product.id,
              attributes,
              sku: seed.sku,
              price: seed.minPrice,
              stockQuantity: seed.stockQuantity,
              stockStatus: 'instock',
              isActive: true,
              isOnSale: false,
            }),
          );
        }
      }
    }
  }
}
