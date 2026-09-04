import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity.js';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectRepository(Brand) private readonly repo: Repository<Brand>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  async getNextLegacyId(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('brand')
      .select('COALESCE(MAX(brand.legacyId), 0) + 1', 'next')
      .where('brand.legacyTable = :table', { table: 'brands' })
      .getRawOne<{ next: string }>();

    return Number(result?.next ?? 1);
  }

  findAllActive() {
    return this.repo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  create(data: Partial<Brand>) {
    return this.repo.create(data);
  }

  save(brand: Brand) {
    return this.repo.save(brand);
  }

  remove(brand: Brand) {
    return this.repo.remove(brand);
  }
}
