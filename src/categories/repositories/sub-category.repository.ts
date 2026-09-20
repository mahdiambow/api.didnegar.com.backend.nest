import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubCategory } from '../entities/sub-category.entity.js';

export type SubCategoryFilters = {
  categoryId?: string;
  categoryIds?: string[];
  parentCategoryId?: string;
  search?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
};

@Injectable()
export class SubCategoryRepository {
  constructor(
    @InjectRepository(SubCategory) private readonly repo: Repository<SubCategory>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { category: { parentCategory: true } },
    });
  }

  findByCategoryAndSlug(categoryId: string, slug: string) {
    return this.repo.findOne({ where: { categoryId, slug } });
  }

  findAll(filters: { categoryId?: string; parentCategoryId?: string } = {}) {
    const qb = this.repo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.category', 'category')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory')
      .orderBy('sub.sort', 'ASC')
      .addOrderBy('sub.name', 'ASC');

    if (filters.categoryId) {
      qb.andWhere('sub.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.parentCategoryId) {
      qb.andWhere('category.parentCategoryId = :parentCategoryId', {
        parentCategoryId: filters.parentCategoryId,
      });
    }

    return qb.getMany();
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: SubCategoryFilters = {},
  ) {
    return this.buildFilteredQuery(filters)
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  findFiltered(filters: SubCategoryFilters = {}) {
    return this.buildFilteredQuery(filters).getMany();
  }

  private buildFilteredQuery(filters: SubCategoryFilters = {}) {
    const qb = this.repo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.category', 'category')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory');

    if (filters.categoryId) {
      qb.andWhere('sub.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.categoryIds?.length) {
      qb.andWhere('sub.categoryId IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    if (filters.parentCategoryId) {
      qb.andWhere('category.parentCategoryId = :parentCategoryId', {
        parentCategoryId: filters.parentCategoryId,
      });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('sub.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        '(sub.name LIKE :search OR sub.nameEn LIKE :search OR sub.slug LIKE :search)',
        { search },
      );
    }

    if (filters.name?.trim()) {
      qb.andWhere('sub.name LIKE :name', {
        name: `%${filters.name.trim()}%`,
      });
    }

    if (filters.slug?.trim()) {
      qb.andWhere('sub.slug LIKE :slug', {
        slug: `%${filters.slug.trim()}%`,
      });
    }

    return qb.orderBy('sub.sort', 'ASC').addOrderBy('sub.name', 'ASC');
  }

  findByCategoryId(categoryId: string) {
    return this.findAll({ categoryId });
  }

  create(data: Partial<SubCategory>) {
    return this.repo.create(data);
  }

  save(subCategory: SubCategory) {
    return this.repo.save(subCategory);
  }

  remove(subCategory: SubCategory) {
    return this.repo.remove(subCategory);
  }
}
