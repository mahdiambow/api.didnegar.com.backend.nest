import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';

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
