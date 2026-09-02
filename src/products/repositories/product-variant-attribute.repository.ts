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
      relations: { attributeValue: true, variant: true },
    });
  }

  findByVariantAndAttributeValue(variantId: string, attributeValueId: string) {
    return this.repo.findOne({ where: { variantId, attributeValueId } });
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
