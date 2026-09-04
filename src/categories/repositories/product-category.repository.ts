import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProductCategory } from '../entities/product-category.entity.js';

@Injectable()
export class ProductCategoryRepository {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly repo: Repository<ProductCategory>,
  ) {}

  private readonly relations = {
    category: true,
    subCategory: { category: true },
    product: true,
  } as const;

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: this.relations,
    });
  }

  findByProductCategorySubCategory(
    productId: string,
    categoryId: string | null,
    subCategoryId: string | null,
  ) {
    return this.repo.findOne({
      where: {
        productId,
        categoryId: categoryId === null ? IsNull() : categoryId,
        subCategoryId: subCategoryId === null ? IsNull() : subCategoryId,
      },
    });
  }

  findByProductId(productId: string) {
    return this.repo.find({
      where: { productId },
      relations: {
        category: true,
        subCategory: { category: true },
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: {
      productId?: string;
      categoryId?: string;
      subCategoryId?: string;
    },
  ) {
    const qb = this.repo
      .createQueryBuilder('pc')
      .leftJoinAndSelect('pc.category', 'category')
      .leftJoinAndSelect('pc.subCategory', 'subCategory')
      .leftJoinAndSelect('subCategory.category', 'subCategoryCategory')
      .orderBy('pc.position', 'ASC')
      .addOrderBy('pc.createdAt', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.productId) {
      qb.andWhere('pc.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters.categoryId) {
      qb.andWhere('pc.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.subCategoryId) {
      qb.andWhere('pc.subCategoryId = :subCategoryId', {
        subCategoryId: filters.subCategoryId,
      });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<ProductCategory>) {
    return this.repo.create(data);
  }

  save(link: ProductCategory) {
    return this.repo.save(link);
  }

  remove(link: ProductCategory) {
    return this.repo.remove(link);
  }

  async clearPrimaryForProduct(productId: string, exceptId?: string) {
    const qb = this.repo
      .createQueryBuilder()
      .update(ProductCategory)
      .set({ isPrimary: false })
      .where('productId = :productId', { productId });

    if (exceptId) {
      qb.andWhere('id != :exceptId', { exceptId });
    }

    await qb.execute();
  }
}
