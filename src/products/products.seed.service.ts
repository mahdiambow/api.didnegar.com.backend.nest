import { DataSource } from 'typeorm';
import { SellerOffer } from '../offers/entities/seller-offer.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../brands/repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductStockRepository } from './repositories/product-stock.repository.js';

const FAKE_BRANDS = [
  {
    slug: 'sony',
    name: 'سونی',
    nameEn: 'Sony',
    legacyId: 101,
    seoDescription: 'دوربین و تجهیزات تصویر',
  },
  {
    slug: 'canon',
    name: 'کانن',
    nameEn: 'Canon',
    legacyId: 102,
    seoDescription: 'دوربین و لنز عکاسی',
  },
  {
    slug: 'nikon',
    name: 'نیکون',
    nameEn: 'Nikon',
    legacyId: 103,
    seoDescription: 'دوربین DSLR و بدون آینه',
  },
  {
    slug: 'dji',
    name: 'دی‌جی‌آی',
    nameEn: 'DJI',
    legacyId: 104,
    seoDescription: 'گیمبال و دوربین اکشن',
  },
  {
    slug: 'godox',
    name: 'گودکس',
    nameEn: 'Godox',
    legacyId: 105,
    seoDescription: 'فلاش و نورپردازی',
  },
  {
    slug: 'aputure',
    name: 'آپیوچر',
    nameEn: 'Aputure',
    legacyId: 106,
    seoDescription: 'نور ثابت LED',
  },
  {
    slug: 'rode',
    name: 'رود',
    nameEn: 'Rode',
    legacyId: 107,
    seoDescription: 'میکروفون و تجهیزات صدا',
  },
  {
    slug: 'zoom',
    name: 'زوم',
    nameEn: 'Zoom',
    legacyId: 108,
    seoDescription: 'رکوردر صدا',
  },
  {
    slug: 'manfrotto',
    name: 'مانفروتو',
    nameEn: 'Manfrotto',
    legacyId: 109,
    seoDescription: 'سه پایه و تجهیزات جانبی',
  },
  {
    slug: 'blackmagic',
    name: 'بلک‌مجیک',
    nameEn: 'Blackmagic',
    legacyId: 110,
    seoDescription: 'دوربین سینمایی',
  },
  {
    slug: 'gopro',
    name: 'گوپرو',
    nameEn: 'GoPro',
    legacyId: 111,
    seoDescription: 'دوربین اکشن',
  },
  {
    slug: 'sennheiser',
    name: 'سنهایزر',
    nameEn: 'Sennheiser',
    legacyId: 112,
    seoDescription: 'میکروفون حرفه‌ای',
  },
  {
    slug: 'neewer',
    name: 'نیور',
    nameEn: 'Neewer',
    legacyId: 113,
    seoDescription: 'بک‌گراند و تجهیزات استودیو',
  },
] as const;

const FAKE_PRODUCTS = [
  {
    slug: 'sony-a7iv',
    name: 'دوربین سونی Alpha A7 IV',
    brandSlug: 'sony',
    sku: 'SNY-A7IV-BODY',
    shortDescription: 'دوربین بدون آینه فول‌فریم ۳۳ مگاپیکسل',
    price: 185000000,
    stock: 8,
    averageRating: 4.8,
    ratingCount: 64,
    totalSales: 120,
  },
  {
    slug: 'canon-r6-ii',
    name: 'دوربین کانن EOS R6 Mark II',
    brandSlug: 'canon',
    sku: 'CAN-R6M2-BODY',
    shortDescription: 'بدون آینه سریع با فوکوس چشم حیوانات',
    price: 168000000,
    stock: 6,
    averageRating: 4.7,
    ratingCount: 41,
    totalSales: 95,
  },
  {
    slug: 'nikon-d850',
    name: 'دوربین نیکون D850',
    brandSlug: 'nikon',
    sku: 'NIK-D850-BODY',
    shortDescription: 'DSLR حرفه‌ای ۴۵.۷ مگاپیکسل',
    price: 142000000,
    stock: 4,
    averageRating: 4.9,
    ratingCount: 88,
    totalSales: 210,
  },
  {
    slug: 'sony-50mm-f14',
    name: 'لنز سونی 50mm f/1.4 GM',
    brandSlug: 'sony',
    sku: 'SNY-50F14-GM',
    shortDescription: 'لنز پرایم پرتره شارپ',
    price: 72000000,
    stock: 12,
    averageRating: 4.6,
    ratingCount: 33,
    totalSales: 70,
  },
  {
    slug: 'canon-24-70-f28',
    name: 'لنز کانن RF 24-70mm f/2.8',
    brandSlug: 'canon',
    sku: 'CAN-RF2470-F28',
    shortDescription: 'لنز زوم استاندارد حرفه‌ای',
    price: 98000000,
    stock: 7,
    averageRating: 4.8,
    ratingCount: 52,
    totalSales: 110,
  },
  {
    slug: 'manfrotto-tripod',
    name: 'سه پایه مانفروتو Befree Advanced',
    brandSlug: 'manfrotto',
    sku: 'MFT-BEFREE-ADV',
    shortDescription: 'سه پایه مسافرتی سبک آلومینیومی',
    price: 18500000,
    stock: 25,
    averageRating: 4.5,
    ratingCount: 29,
    totalSales: 180,
  },
  {
    slug: 'dji-rs3-pro',
    name: 'گیمبال DJI RS 3 Pro',
    brandSlug: 'dji',
    sku: 'DJI-RS3-PRO',
    shortDescription: 'استابلایزر فیلمبرداری حرفه‌ای',
    price: 42000000,
    stock: 10,
    averageRating: 4.7,
    ratingCount: 47,
    totalSales: 150,
  },
  {
    slug: 'blackmagic-6k-pro',
    name: 'دوربین Blackmagic Pocket Cinema 6K Pro',
    brandSlug: 'blackmagic',
    sku: 'BMD-P6K-PRO',
    shortDescription: 'دوربین سینمایی با ND داخلی',
    price: 155000000,
    stock: 3,
    averageRating: 4.6,
    ratingCount: 22,
    totalSales: 40,
  },
  {
    slug: 'gopro-hero12',
    name: 'گوپرو Hero 12 Black',
    brandSlug: 'gopro',
    sku: 'GPR-HERO12',
    shortDescription: 'دوربین اکشن ضدآب 5.3K',
    price: 28500000,
    stock: 30,
    averageRating: 4.4,
    ratingCount: 101,
    totalSales: 320,
  },
  {
    slug: 'godox-v1',
    name: 'اسپیدلایت گودکس V1',
    brandSlug: 'godox',
    sku: 'GDX-V1-CAN',
    shortDescription: 'فلاش گرد سر با باتری لیتیوم',
    price: 14500000,
    stock: 18,
    averageRating: 4.5,
    ratingCount: 76,
    totalSales: 240,
  },
  {
    slug: 'aputure-300d',
    name: 'نور ثابت آپیوچر 300D II',
    brandSlug: 'aputure',
    sku: 'APT-300D-II',
    shortDescription: 'پنل LED قوی برای فیلم و استودیو',
    price: 52000000,
    stock: 5,
    averageRating: 4.8,
    ratingCount: 19,
    totalSales: 55,
  },
  {
    slug: 'neewer-backdrop-kit',
    name: 'ست بک‌گراند نیور با پایه',
    brandSlug: 'neewer',
    sku: 'NWR-BG-KIT-2M',
    shortDescription: 'ست ۲ متری با ۳ بک‌گراند',
    price: 8900000,
    stock: 22,
    averageRating: 4.2,
    ratingCount: 38,
    totalSales: 160,
  },
  {
    slug: 'zoom-h6',
    name: 'رکوردر زوم H6',
    brandSlug: 'zoom',
    sku: 'ZOM-H6-BLK',
    shortDescription: 'رکوردر ۶ کاناله قابل حمل',
    price: 24500000,
    stock: 14,
    averageRating: 4.7,
    ratingCount: 55,
    totalSales: 130,
  },
  {
    slug: 'rode-wireless-go-ii',
    name: 'میکروفون بی‌سیم رود Wireless GO II',
    brandSlug: 'rode',
    sku: 'ROD-WGO2-DUAL',
    shortDescription: 'ست دوال کانال برای ویدیو و پادکست',
    price: 19500000,
    stock: 20,
    averageRating: 4.6,
    ratingCount: 90,
    totalSales: 280,
  },
  {
    slug: 'sennheiser-mke600',
    name: 'میکروفون شاتگان سنهایزر MKE 600',
    brandSlug: 'sennheiser',
    sku: 'SEN-MKE600',
    shortDescription: 'شاتگان حرفه‌ای برای فیلمبرداری',
    price: 26500000,
    stock: 9,
    averageRating: 4.8,
    ratingCount: 44,
    totalSales: 100,
  },
  {
    slug: 'rode-boom-pole',
    name: 'بوم پل رود Boompole Pro',
    brandSlug: 'rode',
    sku: 'ROD-BOOM-PRO',
    shortDescription: 'پایه بوم کربنی سبک برای میکروفون',
    price: 9800000,
    stock: 16,
    averageRating: 4.3,
    ratingCount: 21,
    totalSales: 75,
  },
] as const;

@Injectable()
export class ProductsSeedService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly brandRepository: BrandRepository,
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
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
          nameEn: brand.nameEn,
          legacyId: brand.legacyId,
          legacyTable: 'brands',
          seoDescription: brand.seoDescription,
          isActive: true,
        }),
      );
      brandMap.set(brand.slug, created.id);
    }

    const seller = await this.dataSource
      .getRepository(Seller)
      .findOneBy({ slug: 'didnegar-shop' });

    for (const [index, product] of FAKE_PRODUCTS.entries()) {
      let created = await this.productRepository.findBySlug(product.slug);
      if (!created) {
        await this.productRepository.save(
          this.productRepository.create({
            legacyId: index + 100,
            legacyTable: 'products',
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            shortDescription: product.shortDescription,
            status: 'publish',
            approvalStatus: 'approved',
            brandId: brandMap.get(product.brandSlug) ?? null,
            averageRating: product.averageRating,
            ratingCount: product.ratingCount,
            totalSales: product.totalSales,
            isActive: true,
            isFeatured: index < 4,
            price: {
              attributeIds: [],
              price: product.price,
              discountPercentage: null,
              discountAmount: null,
              expireDate: null,
              maxQuantity: null,
              minQuantity: 1,
              finalPrice: product.price,
            },
            attributeIds: [],
            sellerIds: seller ? [seller.id] : [],
            createdBySellerId: seller?.id ?? null,
          }),
        );
        created = await this.productRepository.findBySlug(product.slug);
      }

      if (created) {
        await this.productStockRepository.upsertForProduct(
          created.id,
          product.stock,
        );
      }

      if (!created || !seller) continue;

      const offers = this.dataSource.getRepository(SellerOffer);
      const offerSku = `${product.sku}-OFFER`;
      if (!(await offers.existsBy({ sku: offerSku }))) {
        await offers.save(
          offers.create({
            sellerId: seller.id,
            productId: created.id,
            attributes: {},
            sku: offerSku,
            price: product.price,
            stock: Math.max(1, Math.floor(product.stock / 2)),
            stockStatus: 'instock',
            isActive: true,
            isOnSale: false,
            approvalStatus: 'approved',
          }),
        );
      }
    }
  }
}
