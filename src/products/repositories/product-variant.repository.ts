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
    return this.repo.findOne({ where: { id } });
  }

  findByProductId(productId: string) {
    return this.repo.find({
      where: { productId },
      order: { id: 'ASC' },
    });
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
