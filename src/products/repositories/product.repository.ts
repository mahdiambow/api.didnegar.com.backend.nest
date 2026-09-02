import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';

export interface ProductFilters {
  status?: string;
  brandId?: string;
  name?: string;
  isOnSale?: boolean;
  stockStatus?: string;
  categoryId?: string;
  subCategoryId?: string;
  attributeId?: string;
}

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  findById(id: string, includeRelations = false) {
    return this.repo.findOne({
      where: { id },
      relations: includeRelations
        ? {
            brand: true,
            productCategories: {
              category: true,
              subCategory: { category: true },
            },
            variants: { variantAttributes: { attributeValue: { attribute: true } } },
          }
        : undefined,
    });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findBySku(sku: string) {
    return this.repo.findOne({ where: { sku } });
  }

  findBySkus(skus: string[]) {
    if (!skus.length) {
      return Promise.resolve([]);
    }

    return this.repo.find({ where: { sku: In(skus) } });
  }

  findByFilters(filters: ProductFilters = {}) {
    const qb = this.repo
      .createQueryBuilder('product')
      .orderBy('product.name', 'ASC');

    if (filters.status) {
      qb.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters.brandId) {
      qb.andWhere('product.brandId = :brandId', { brandId: filters.brandId });
    }

    if (filters.name) {
      qb.andWhere('product.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.isOnSale !== undefined) {
      qb.andWhere('product.isOnSale = :isOnSale', {
        isOnSale: filters.isOnSale,
      });
    }

    if (filters.stockStatus) {
      qb.andWhere('product.stockStatus = :stockStatus', {
        stockStatus: filters.stockStatus,
      });
    }

    return qb.getMany();
  }

  findAllForPricingExport() {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: ProductFilters = {},
    includeRelations = false,
  ) {
    const qb = this.repo
      .createQueryBuilder('product')
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (includeRelations) {
      qb.leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.productCategories', 'productCategories')
        .leftJoinAndSelect('productCategories.category', 'category')
        .leftJoinAndSelect('productCategories.subCategory', 'subCategory')
        .leftJoinAndSelect('subCategory.category', 'subCategoryCategory')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.variantAttributes', 'variantAttributes')
        .leftJoinAndSelect('variantAttributes.attributeValue', 'attributeValue')
        .leftJoinAndSelect('attributeValue.attribute', 'attribute');
    }

    if (filters.categoryId) {
      qb.innerJoin(
        'product.productCategories',
        'pcCategory',
        'pcCategory.categoryId = :categoryId',
        { categoryId: filters.categoryId },
      );
    }

    if (filters.subCategoryId) {
      qb.innerJoin(
        'product.productCategories',
        'pcSubCategory',
        'pcSubCategory.subCategoryId = :subCategoryId',
        { subCategoryId: filters.subCategoryId },
      );
    }

    if (filters.attributeId) {
      qb.innerJoin(
        'product.variants',
        'pcVariant',
        'pcVariant.id = :attributeId',
        { attributeId: filters.attributeId },
      );
    }

    if (filters.status) {
      qb.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters.brandId) {
      qb.andWhere('product.brandId = :brandId', { brandId: filters.brandId });
    }

    if (filters.name) {
      qb.andWhere('product.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.isOnSale !== undefined) {
      qb.andWhere('product.isOnSale = :isOnSale', {
        isOnSale: filters.isOnSale,
      });
    }

    if (filters.stockStatus) {
      qb.andWhere('product.stockStatus = :stockStatus', {
        stockStatus: filters.stockStatus,
      });
    }

    return qb.getManyAndCount();
  }

  getNextLegacyId() {
    return this.repo.manager
      .createQueryBuilder()
      .select('COALESCE(MAX(product.legacyId), 0) + 1', 'next')
      .from(Product, 'product')
      .where('product.legacyTable = :table', { table: 'products' })
      .getRawOne<{ next: string }>()
      .then((row) => Number(row?.next ?? 1));
  }

  create(data: Partial<Product>) {
    return this.repo.create(data);
  }

  save(product: Product) {
    return this.repo.save(product);
  }

  saveMany(products: Product[]) {
    return this.repo.save(products);
  }

  remove(product: Product) {
    return this.repo.remove(product);
  }
}
