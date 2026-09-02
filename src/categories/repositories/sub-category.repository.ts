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
      relations: { category: true },
    });
  }

  findByCategoryAndSlug(categoryId: string, slug: string) {
    return this.repo.findOne({ where: { categoryId, slug } });
  }

  findByCategoryId(categoryId: string) {
    return this.repo.find({
      where: { categoryId },
      order: { name: 'ASC' },
    });
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
