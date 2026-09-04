import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantAttribute } from '../entities/product-variant-attribute.entity.js';

@Injectable()
export class ProductVariantAttributeRepository {
  constructor(
    @InjectRepository(ProductVariantAttribute)
    private readonly repo: Repository<ProductVariantAttribute>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { attributeValue: { attribute: true }, variant: true },
    });
  }

  findByVariantId(variantId: string) {
    return this.repo.find({
      where: { variantId },
      relations: { attributeValue: { attribute: true } },
      order: { createdAt: 'ASC' },
    });
  }

  findByVariantAndAttributeValue(variantId: string, attributeValueId: string) {
    return this.repo.findOne({ where: { variantId, attributeValueId } });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { variantId?: string; attributeValueId?: string },
  ) {
    const qb = this.repo
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.attributeValue', 'attributeValue')
      .leftJoinAndSelect('attributeValue.attribute', 'attribute')
      .leftJoinAndSelect('link.variant', 'variant')
      .orderBy('link.createdAt', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.variantId) {
      qb.andWhere('link.variantId = :variantId', {
        variantId: filters.variantId,
      });
    }

    if (filters.attributeValueId) {
      qb.andWhere('link.attributeValueId = :attributeValueId', {
        attributeValueId: filters.attributeValueId,
      });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<ProductVariantAttribute>) {
    return this.repo.create(data);
  }

  save(link: ProductVariantAttribute) {
    return this.repo.save(link);
  }

  remove(link: ProductVariantAttribute) {
    return this.repo.remove(link);
  }
}
