import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';

export interface ProductFilters {
  status?: string;
  approvalStatus?: string;
  isActive?: boolean;
  brandId?: string;
  search?: string;
  name?: string;
  categoryId?: string;
  subCategoryId?: string;
}

/** none = بدون join | list = برند+موجودی | detail = درخت کامل */
export type ProductRelationMode = 'none' | 'list' | 'detail';

function toRelationMode(
  includeRelations: boolean | ProductRelationMode,
): ProductRelationMode {
  if (includeRelations === true) return 'detail';
  if (includeRelations === false) return 'none';
  return includeRelations;
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
            shippingMethod: true,
            productStock: true,
            productCategories: {
              category: { parentCategory: true },
              subCategory: { category: { parentCategory: true } },
            },
          }
        : undefined,
    });
  }

  findByIds(
    ids: string[],
    includeRelations: boolean | ProductRelationMode = false,
  ) {
    if (ids.length === 0) return Promise.resolve([] as Product[]);
    const mode = toRelationMode(includeRelations);
    const relations =
      mode === 'list'
        ? { brand: true, productStock: true }
        : mode === 'detail'
          ? {
              brand: true,
              shippingMethod: true,
              productStock: true,
              productCategories: {
                category: { parentCategory: true },
                subCategory: { category: { parentCategory: true } },
              },
            }
          : undefined;
    return this.repo.find({
      where: { id: In([...new Set(ids)]) },
      relations,
    });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findBySku(sku: string) {
    return this.repo.findOne({ where: { sku } });
  }

  async slugExists(slug: string, excludeId?: string) {
    const qb = this.repo
      .createQueryBuilder('product')
      .where('product.slug = :slug', { slug });
    if (excludeId) qb.andWhere('product.id <> :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }

  async skuExists(sku: string, excludeId?: string) {
    const qb = this.repo
      .createQueryBuilder('product')
      .where('product.sku = :sku', { sku });
    if (excludeId) qb.andWhere('product.id <> :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }

  findByFilters(filters: ProductFilters = {}, includeRelations = false) {
    const needsCategoryFilter = Boolean(
      filters.categoryId || filters.subCategoryId,
    );
    const qb = this.repo
      .createQueryBuilder('product')
      .orderBy('product.createdAt', 'DESC');

    if (includeRelations) {
      qb.leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.shippingMethod', 'shippingMethod')
        .leftJoinAndSelect('product.productStock', 'productStock')
        .leftJoinAndSelect('product.productCategories', 'productCategories')
        .leftJoinAndSelect('productCategories.category', 'category')
        .leftJoinAndSelect('category.parentCategory', 'parentCategory')
        .leftJoinAndSelect('productCategories.subCategory', 'subCategory')
        .leftJoinAndSelect('subCategory.category', 'subCategoryCategory')
        .leftJoinAndSelect(
          'subCategoryCategory.parentCategory',
          'subParentCategory',
        );
    }

    if (filters.status) {
      qb.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters.approvalStatus) {
      qb.andWhere('product.approvalStatus = :approvalStatus', {
        approvalStatus: filters.approvalStatus,
      });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.brandId) {
      qb.andWhere('product.brandId = :brandId', { brandId: filters.brandId });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        `(product.name LIKE :search
          OR product.subtitle LIKE :search
          OR product.slug LIKE :search
          OR product.sku LIKE :search)`,
        { search },
      );
    }

    if (filters.name) {
      qb.andWhere('product.name LIKE :name', { name: `%${filters.name}%` });
    }

    if (needsCategoryFilter) {
      qb.innerJoin('product.productCategories', 'pcFilter');
      if (filters.categoryId) {
        qb.andWhere('pcFilter.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }
      if (filters.subCategoryId) {
        qb.andWhere('pcFilter.subCategoryId = :subCategoryId', {
          subCategoryId: filters.subCategoryId,
        });
      }
    }

    if (needsCategoryFilter || includeRelations) {
      qb.distinct(true);
    }

    return qb.getMany();
  }

  findFiltered(filters: ProductFilters = {}, includeRelations = false) {
    return this.findByFilters(filters, includeRelations);
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
    includeRelations: boolean | ProductRelationMode = false,
  ) {
    const mode = toRelationMode(includeRelations);
    const needsCategoryFilter = Boolean(
      filters.categoryId || filters.subCategoryId,
    );
    const qb = this.repo
      .createQueryBuilder('product')
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (mode === 'list') {
      qb.leftJoinAndSelect('product.brand', 'brand').leftJoinAndSelect(
        'product.productStock',
        'productStock',
      );
    } else if (mode === 'detail') {
      qb.leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.shippingMethod', 'shippingMethod')
        .leftJoinAndSelect('product.productStock', 'productStock')
        .leftJoinAndSelect('product.productCategories', 'productCategories')
        .leftJoinAndSelect('productCategories.category', 'category')
        .leftJoinAndSelect('category.parentCategory', 'parentCategory')
        .leftJoinAndSelect('productCategories.subCategory', 'subCategory')
        .leftJoinAndSelect('subCategory.category', 'subCategoryCategory')
        .leftJoinAndSelect(
          'subCategoryCategory.parentCategory',
          'subParentCategory',
        );
    }

    if (needsCategoryFilter) {
      qb.innerJoin('product.productCategories', 'pcFilter');
      if (filters.categoryId) {
        qb.andWhere('pcFilter.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }
      if (filters.subCategoryId) {
        qb.andWhere('pcFilter.subCategoryId = :subCategoryId', {
          subCategoryId: filters.subCategoryId,
        });
      }
    }

    if (filters.status) {
      qb.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters.approvalStatus) {
      qb.andWhere('product.approvalStatus = :approvalStatus', {
        approvalStatus: filters.approvalStatus,
      });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.brandId) {
      qb.andWhere('product.brandId = :brandId', { brandId: filters.brandId });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        `(product.name LIKE :search
          OR product.subtitle LIKE :search
          OR product.slug LIKE :search
          OR product.sku LIKE :search)`,
        { search },
      );
    }

    if (filters.name) {
      qb.andWhere('product.name LIKE :name', { name: `%${filters.name}%` });
    }

    // distinct فقط وقتی join فیلتر دسته باعث تکرار ردیف می‌شود
    if (needsCategoryFilter || mode === 'detail') {
      qb.distinct(true);
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
