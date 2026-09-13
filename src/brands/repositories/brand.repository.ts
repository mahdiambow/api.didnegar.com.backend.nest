import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity.js';

export type BrandFilters = {
  search?: string;
  name?: string;
  nameEn?: string;
  slug?: string;
  isActive?: boolean;
};

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

  findPaginated(offset: number, limit: number, filters: BrandFilters = {}) {
    const qb = this.repo.createQueryBuilder('brand');

    if (filters.isActive !== undefined) {
      qb.andWhere('brand.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        '(brand.name LIKE :search OR brand.nameEn LIKE :search OR brand.slug LIKE :search)',
        { search },
      );
    }

    if (filters.name?.trim()) {
      qb.andWhere('brand.name LIKE :name', {
        name: `%${filters.name.trim()}%`,
      });
    }

    if (filters.nameEn?.trim()) {
      qb.andWhere('brand.nameEn LIKE :nameEn', {
        nameEn: `%${filters.nameEn.trim()}%`,
      });
    }

    if (filters.slug?.trim()) {
      qb.andWhere('brand.slug LIKE :slug', {
        slug: `%${filters.slug.trim()}%`,
      });
    }

    return qb
      .orderBy('brand.name', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
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
