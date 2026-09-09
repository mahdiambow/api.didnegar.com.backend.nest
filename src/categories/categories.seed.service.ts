import { Injectable } from '@nestjs/common';
import { ParentCategoryRepository } from './repositories/parent-category.repository.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { SubCategoryRepository } from './repositories/sub-category.repository.js';
import { ProductCategoryRepository } from './repositories/product-category.repository.js';
import { ProductRepository } from '../products/repositories/product.repository.js';

type SeedSub = { slug: string; name: string; nameEn?: string };
type SeedCategory = {
  slug: string;
  name: string;
  nameEn?: string;
  subCategories: SeedSub[];
};
type SeedParent = {
  slug: string;
  name: string;
  nameEn: string;
  categories: SeedCategory[];
};

const SEED_TREE: SeedParent[] = [
  {
    slug: 'photography',
    name: 'عکاسی',
    nameEn: 'Photography',
    categories: [
      {
        slug: 'photo-cameras',
        name: 'دوربین عکاسی',
        nameEn: 'Photo Cameras',
        subCategories: [
          { slug: 'mirrorless-cameras', name: 'دوربین بدون آینه', nameEn: 'Mirrorless' },
          { slug: 'dslr-cameras', name: 'دوربین DSLR', nameEn: 'DSLR' },
          { slug: 'compact-cameras', name: 'دوربین کامپکت', nameEn: 'Compact' },
        ],
      },
      {
        slug: 'camera-lenses',
        name: 'لنز دوربین',
        nameEn: 'Camera Lenses',
        subCategories: [
          { slug: 'prime-lenses', name: 'لنز پرایم', nameEn: 'Prime Lenses' },
          { slug: 'zoom-lenses', name: 'لنز زوم', nameEn: 'Zoom Lenses' },
          { slug: 'wide-lenses', name: 'لنز واید', nameEn: 'Wide Lenses' },
        ],
      },
      {
        slug: 'photo-accessories',
        name: 'لوازم جانبی',
        nameEn: 'Photo Accessories',
        subCategories: [
          { slug: 'tripods', name: 'سه پایه', nameEn: 'Tripods' },
          { slug: 'camera-bags', name: 'کیف و کوله دوربین', nameEn: 'Camera Bags' },
          { slug: 'memory-cards', name: 'کارت حافظه', nameEn: 'Memory Cards' },
        ],
      },
    ],
  },
  {
    slug: 'videography',
    name: 'فیلمبرداری',
    nameEn: 'Videography',
    categories: [
      {
        slug: 'video-gear',
        name: 'لوازم فیلم برداری',
        nameEn: 'Video Gear',
        subCategories: [
          { slug: 'gimbals', name: 'گیمبال', nameEn: 'Gimbals' },
          { slug: 'video-monitors', name: 'مانیتور فیلمبرداری', nameEn: 'Monitors' },
          { slug: 'video-rigs', name: 'ریگ و کیج', nameEn: 'Rigs & Cages' },
        ],
      },
      {
        slug: 'video-cameras',
        name: 'دوربین فیلم برداری',
        nameEn: 'Video Cameras',
        subCategories: [
          { slug: 'cinema-cameras', name: 'دوربین سینمایی', nameEn: 'Cinema Cameras' },
          { slug: 'camcorders', name: 'دوربین فیلمبرداری دستی', nameEn: 'Camcorders' },
          { slug: 'action-cameras', name: 'دوربین اکشن', nameEn: 'Action Cameras' },
        ],
      },
      {
        slug: 'video-accessories',
        name: 'لوازم جانبی فیلم برداری',
        nameEn: 'Video Accessories',
        subCategories: [
          { slug: 'nd-filters', name: 'فیلتر ND', nameEn: 'ND Filters' },
          { slug: 'follow-focus', name: 'فالو فوکوس', nameEn: 'Follow Focus' },
          { slug: 'video-batteries', name: 'باتری و پاور', nameEn: 'Batteries' },
        ],
      },
    ],
  },
  {
    slug: 'lighting',
    name: 'نورپردازی',
    nameEn: 'Lighting',
    categories: [
      {
        slug: 'lighting-equipment',
        name: 'تجهیزات نور پردازی',
        nameEn: 'Lighting Equipment',
        subCategories: [
          { slug: 'softboxes', name: 'سافت باکس', nameEn: 'Softboxes' },
          { slug: 'light-stands', name: 'پایه نور', nameEn: 'Light Stands' },
          { slug: 'modifiers', name: 'مودیفایر نور', nameEn: 'Modifiers' },
        ],
      },
      {
        slug: 'photo-flash',
        name: 'فلاش عکاسی',
        nameEn: 'Photo Flash',
        subCategories: [
          { slug: 'speedlights', name: 'اسپیدلایت', nameEn: 'Speedlights' },
          { slug: 'studio-strobes', name: 'فلاش استودیویی', nameEn: 'Studio Strobes' },
          { slug: 'flash-triggers', name: 'تریگر فلاش', nameEn: 'Triggers' },
        ],
      },
      {
        slug: 'continuous-light',
        name: 'نور ثابت',
        nameEn: 'Continuous Light',
        subCategories: [
          { slug: 'led-panels', name: 'پنل LED', nameEn: 'LED Panels' },
          { slug: 'ring-lights', name: 'رینگ لایت', nameEn: 'Ring Lights' },
          { slug: 'tube-lights', name: 'تیوب لایت', nameEn: 'Tube Lights' },
        ],
      },
      {
        slug: 'backdrop-stands',
        name: 'بک گراند عکاسی و پایه',
        nameEn: 'Backdrops & Stands',
        subCategories: [
          { slug: 'backdrop-kits', name: 'ست بک گراند', nameEn: 'Backdrop Kits' },
          { slug: 'backdrop-papers', name: 'کاغذ و پارچه بک گراند', nameEn: 'Papers & Fabrics' },
          { slug: 'support-systems', name: 'سیستم نگهداری بک گراند', nameEn: 'Support Systems' },
        ],
      },
    ],
  },
  {
    slug: 'audio-equipment',
    name: 'تجهیزات صدا',
    nameEn: 'Audio Equipment',
    categories: [
      {
        slug: 'audio-gear',
        name: 'تجهیزات صدا خرید و قیمت',
        nameEn: 'Audio Gear',
        subCategories: [
          { slug: 'recorders', name: 'رکوردر صدا', nameEn: 'Recorders' },
          { slug: 'mixers', name: 'میکسر صدا', nameEn: 'Mixers' },
          { slug: 'audio-interfaces', name: 'اینترفیس صدا', nameEn: 'Interfaces' },
        ],
      },
      {
        slug: 'microphones',
        name: 'میکروفون',
        nameEn: 'Microphones',
        subCategories: [
          { slug: 'lavalier-mics', name: 'میکروفون یقه ای', nameEn: 'Lavalier' },
          { slug: 'shotgun-mics', name: 'میکروفون شاتگان', nameEn: 'Shotgun' },
          { slug: 'wireless-mics', name: 'میکروفون بی‌سیم', nameEn: 'Wireless' },
        ],
      },
      {
        slug: 'mic-accessories',
        name: 'میکروفون لوازم جانبی تجهیزات صدا',
        nameEn: 'Mic Accessories',
        subCategories: [
          { slug: 'mic-stands', name: 'پایه میکروفون', nameEn: 'Mic Stands' },
          { slug: 'windshields', name: 'وینداشیلد و خز', nameEn: 'Windshields' },
          { slug: 'xlr-cables', name: 'کابل XLR', nameEn: 'XLR Cables' },
        ],
      },
    ],
  },
];

/** productSlug → categorySlug:subSlug */
export const PRODUCT_CATEGORY_MAP: Record<
  string,
  { category: string; sub: string }
> = {
  'sony-a7iv': { category: 'photo-cameras', sub: 'mirrorless-cameras' },
  'canon-r6-ii': { category: 'photo-cameras', sub: 'mirrorless-cameras' },
  'nikon-d850': { category: 'photo-cameras', sub: 'dslr-cameras' },
  'sony-50mm-f14': { category: 'camera-lenses', sub: 'prime-lenses' },
  'canon-24-70-f28': { category: 'camera-lenses', sub: 'zoom-lenses' },
  'manfrotto-tripod': { category: 'photo-accessories', sub: 'tripods' },
  'dji-rs3-pro': { category: 'video-gear', sub: 'gimbals' },
  'blackmagic-6k-pro': { category: 'video-cameras', sub: 'cinema-cameras' },
  'gopro-hero12': { category: 'video-cameras', sub: 'action-cameras' },
  'godox-v1': { category: 'photo-flash', sub: 'speedlights' },
  'aputure-300d': { category: 'continuous-light', sub: 'led-panels' },
  'neewer-backdrop-kit': { category: 'backdrop-stands', sub: 'backdrop-kits' },
  'zoom-h6': { category: 'audio-gear', sub: 'recorders' },
  'rode-wireless-go-ii': { category: 'microphones', sub: 'wireless-mics' },
  'sennheiser-mke600': { category: 'microphones', sub: 'shotgun-mics' },
  'rode-boom-pole': { category: 'mic-accessories', sub: 'mic-stands' },
};

@Injectable()
export class CategoriesSeedService {
  private categoryMap = new Map<string, string>();
  private subCategoryMap = new Map<string, string>();

  constructor(
    private readonly parentCategoryRepository: ParentCategoryRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async seedCatalog() {
    this.categoryMap.clear();
    this.subCategoryMap.clear();

    let legacyParent = 1;
    let legacyCategory = 1;
    let legacySub = 1;

    for (const [parentIndex, parentSeed] of SEED_TREE.entries()) {
      let parent = await this.parentCategoryRepository.findBySlug(
        parentSeed.slug,
      );
      if (!parent) {
        parent = await this.parentCategoryRepository.save(
          this.parentCategoryRepository.create({
            slug: parentSeed.slug,
            name: parentSeed.name,
            nameEn: parentSeed.nameEn,
            sort: parentIndex,
            legacyId: legacyParent++,
            legacyTable: 'parent_categories',
            isActive: true,
          }),
        );
      }

      for (const [catIndex, categorySeed] of parentSeed.categories.entries()) {
        let category = await this.categoryRepository.findBySlug(
          categorySeed.slug,
        );
        if (!category) {
          category = await this.categoryRepository.save(
            this.categoryRepository.create({
              parentCategoryId: parent.id,
              slug: categorySeed.slug,
              name: categorySeed.name,
              nameEn: categorySeed.nameEn ?? null,
              sort: catIndex,
              legacyId: legacyCategory++,
              legacyTable: 'categories',
              isActive: true,
            }),
          );
        } else if (category.parentCategoryId !== parent.id) {
          category.parentCategoryId = parent.id;
          category = await this.categoryRepository.save(category);
        }
        this.categoryMap.set(categorySeed.slug, category.id);

        for (const [subIndex, subSeed] of categorySeed.subCategories.entries()) {
          const key = `${categorySeed.slug}:${subSeed.slug}`;
          let sub = await this.subCategoryRepository.findByCategoryAndSlug(
            category.id,
            subSeed.slug,
          );
          if (!sub) {
            sub = await this.subCategoryRepository.save(
              this.subCategoryRepository.create({
                categoryId: category.id,
                slug: subSeed.slug,
                name: subSeed.name,
                nameEn: subSeed.nameEn ?? null,
                sort: subIndex,
                legacyId: legacySub++,
                legacyTable: 'sub_categories',
                isActive: true,
              }),
            );
          }
          this.subCategoryMap.set(key, sub.id);
        }
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
