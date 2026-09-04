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
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
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
