import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubCategory } from '../entities/sub-category.entity.js';

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
