import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentCategory } from '../entities/parent-category.entity.js';

export type ParentCategoryFilters = {
  search?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
};

@Injectable()
export class ParentCategoryRepository {
  constructor(
    @InjectRepository(ParentCategory)
    private readonly repo: Repository<ParentCategory>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findAll() {
    return this.repo.find({ order: { sort: 'ASC', name: 'ASC' } });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: ParentCategoryFilters = {},
  ) {
    return this.buildFilteredQuery(filters)
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  findFiltered(filters: ParentCategoryFilters = {}) {
    return this.buildFilteredQuery(filters).getMany();
  }

  private buildFilteredQuery(filters: ParentCategoryFilters = {}) {
    const qb = this.repo.createQueryBuilder('parent');

    if (filters.isActive !== undefined) {
      qb.andWhere('parent.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        '(parent.name LIKE :search OR parent.nameEn LIKE :search OR parent.slug LIKE :search)',
        { search },
      );
    }

    if (filters.name?.trim()) {
      qb.andWhere('parent.name LIKE :name', {
        name: `%${filters.name.trim()}%`,
      });
    }

    if (filters.slug?.trim()) {
      qb.andWhere('parent.slug LIKE :slug', {
        slug: `%${filters.slug.trim()}%`,
      });
    }

    return qb.orderBy('parent.sort', 'ASC').addOrderBy('parent.name', 'ASC');
  }

  create(data: Partial<ParentCategory>) {
    return this.repo.create(data);
  }

  save(entity: ParentCategory) {
    return this.repo.save(entity);
  }

  remove(entity: ParentCategory) {
    return this.repo.remove(entity);
  }
}
