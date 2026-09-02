import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity.js';

@Injectable()
export class ProductVariantRepository {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly repo: Repository<ProductVariant>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: {
        variantAttributes: { attributeValue: true },
        product: true,
      },
    });
  }

  findBySku(sku: string) {
    return this.repo.findOne({ where: { sku } });
  }

  findByProductId(productId: string) {
    return this.repo.find({
      where: { productId },
      relations: { variantAttributes: { attributeValue: true } },
      order: { createdAt: 'ASC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { productId?: string; isActive?: boolean },
  ) {
    const qb = this.repo
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.variantAttributes', 'variantAttributes')
      .leftJoinAndSelect('variantAttributes.attributeValue', 'attributeValue')
      .orderBy('variant.createdAt', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.productId) {
      qb.andWhere('variant.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('variant.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return qb.getManyAndCount();
  }

  getNextLegacyId() {
    return this.repo.manager
      .createQueryBuilder()
      .select('COALESCE(MAX(variant.legacyId), 0) + 1', 'next')
      .from(ProductVariant, 'variant')
      .where('variant.legacyTable = :table', { table: 'product_variants' })
      .getRawOne<{ next: string }>()
      .then((row) => Number(row?.next ?? 1));
  }

  create(data: Partial<ProductVariant>) {
    return this.repo.create(data);
  }

  save(variant: ProductVariant) {
    return this.repo.save(variant);
  }

  remove(variant: ProductVariant) {
    return this.repo.remove(variant);
  }
}
