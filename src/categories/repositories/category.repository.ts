import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';

export type CategoryFilters = {
  parentCategoryId?: string;
  parentCategoryIds?: string[];
  search?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
};

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { parentCategory: true },
    });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findAll(parentCategoryId?: string) {
    return this.repo.find({
      where: parentCategoryId ? { parentCategoryId } : undefined,
      relations: { parentCategory: true },
      order: { sort: 'ASC', name: 'ASC' },
    });
  }

  findByParentCategoryId(parentCategoryId: string) {
    return this.findAll(parentCategoryId);
  }

  findPaginated(offset: number, limit: number, filters: CategoryFilters = {}) {
    return this.buildFilteredQuery(filters)
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  findFiltered(filters: CategoryFilters = {}) {
    return this.buildFilteredQuery(filters).getMany();
  }

  private buildFilteredQuery(filters: CategoryFilters = {}) {
    const qb = this.repo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory');

    if (filters.parentCategoryId) {
      qb.andWhere('category.parentCategoryId = :parentCategoryId', {
        parentCategoryId: filters.parentCategoryId,
      });
    }

    if (filters.parentCategoryIds?.length) {
      qb.andWhere('category.parentCategoryId IN (:...parentCategoryIds)', {
        parentCategoryIds: filters.parentCategoryIds,
      });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('category.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        '(category.name LIKE :search OR category.nameEn LIKE :search OR category.slug LIKE :search)',
        { search },
      );
    }

    if (filters.name?.trim()) {
      qb.andWhere('category.name LIKE :name', {
        name: `%${filters.name.trim()}%`,
      });
    }

    if (filters.slug?.trim()) {
      qb.andWhere('category.slug LIKE :slug', {
        slug: `%${filters.slug.trim()}%`,
      });
    }

    return qb
      .orderBy('category.sort', 'ASC')
      .addOrderBy('category.name', 'ASC');
  }

  create(data: Partial<Category>) {
    return this.repo.create(data);
  }

  save(category: Category) {
    return this.repo.save(category);
  }

  remove(category: Category) {
    return this.repo.remove(category);
  }
}
