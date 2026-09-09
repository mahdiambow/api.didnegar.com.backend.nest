import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentCategory } from '../entities/parent-category.entity.js';

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
