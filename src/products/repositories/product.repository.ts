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

/** none = بدون join | list = برند+دسته خلاصه | detail = درخت کامل */
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
    if (mode === 'list') {
      return this.repo
        .createQueryBuilder('product')
        .select([
          'product.id',
          'product.name',
          'product.slug',
          'product.price',
          'product.image',
          'product.brandId',
        ])
        .leftJoin('product.brand', 'brand')
        .addSelect([
          'brand.id',
          'brand.name',
          'brand.slug',
          'brand.logoUrl',
        ])
        .leftJoin('product.productCategories', 'productCategories')
        .addSelect([
          'productCategories.id',
          'productCategories.categoryId',
          'productCategories.subCategoryId',
          'productCategories.isPrimary',
          'productCategories.position',
        ])
        .leftJoin('productCategories.category', 'category')
        .addSelect(['category.id', 'category.name', 'category.slug'])
        .leftJoin('productCategories.subCategory', 'subCategory')
        .addSelect([
          'subCategory.id',
          'subCategory.name',
          'subCategory.slug',
          'subCategory.categoryId',
        ])
        .leftJoin('subCategory.category', 'subCategoryCategory')
        .addSelect([
          'subCategoryCategory.id',
          'subCategoryCategory.name',
          'subCategoryCategory.slug',
        ])
        .where('product.id IN (:...ids)', { ids: [...new Set(ids)] })
        .getMany();
    }
    const relations =
      mode === 'detail'
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
          OR product.sku LIKE :search
          OR product.shortDescription LIKE :search)`,
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
      qb.select([
        'product.id',
        'product.name',
        'product.slug',
        'product.price',
        'product.image',
        'product.brandId',
      ])
        .leftJoin('product.brand', 'brand')
        .addSelect([
          'brand.id',
          'brand.name',
          'brand.slug',
          'brand.logoUrl',
        ])
        .leftJoin('product.productCategories', 'productCategories')
        .addSelect([
          'productCategories.id',
          'productCategories.categoryId',
          'productCategories.subCategoryId',
          'productCategories.isPrimary',
          'productCategories.position',
        ])
        .leftJoin('productCategories.category', 'category')
        .addSelect(['category.id', 'category.name', 'category.slug'])
        .leftJoin('productCategories.subCategory', 'subCategory')
        .addSelect([
          'subCategory.id',
          'subCategory.name',
          'subCategory.slug',
          'subCategory.categoryId',
        ])
        .leftJoin('subCategory.category', 'subCategoryCategory')
        .addSelect([
          'subCategoryCategory.id',
          'subCategoryCategory.name',
          'subCategoryCategory.slug',
        ]);
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
          OR product.sku LIKE :search
          OR product.shortDescription LIKE :search)`,
        { search },
      );
    }

    if (filters.name) {
      qb.andWhere('product.name LIKE :name', { name: `%${filters.name}%` });
    }

    // list همیشه join دسته دارد → ممکن است ردیف تکراری شود
    if (needsCategoryFilter || mode === 'detail' || mode === 'list') {
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
