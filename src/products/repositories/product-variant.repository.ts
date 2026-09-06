import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
        variantAttributes: { attributeValue: { attribute: true } },
        product: true,
      },
    });
  }

  findByIds(ids: string[]) {
    if (!ids.length) {
      return Promise.resolve([]);
    }

    return this.repo.find({ where: { id: In(ids) } });
  }

  findByProductId(productId: string) {
    return this.repo.find({
      where: { productId },
      relations: { variantAttributes: { attributeValue: { attribute: true } } },
      order: { id: 'ASC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { productId?: string },
  ) {
    const qb = this.repo
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.variantAttributes', 'variantAttributes')
      .leftJoinAndSelect('variantAttributes.attributeValue', 'attributeValue')
      .leftJoinAndSelect('attributeValue.attribute', 'attribute')
      .orderBy('variant.id', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.productId) {
      qb.andWhere('variant.productId = :productId', {
        productId: filters.productId,
      });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<ProductVariant>) {
    return this.repo.create(data);
  }

  save(variant: ProductVariant) {
    return this.repo.save(variant);
  }

  saveMany(variants: ProductVariant[]) {
    return this.repo.save(variants);
  }

  remove(variant: ProductVariant) {
    return this.repo.remove(variant);
  }
}
