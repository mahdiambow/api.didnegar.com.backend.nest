import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeValue } from '../entities/attribute-value.entity.js';

@Injectable()
export class AttributeValueRepository {
  constructor(
    @InjectRepository(AttributeValue)
    private readonly repo: Repository<AttributeValue>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  create(data: Partial<AttributeValue>) {
    return this.repo.create(data);
  }

  save(attributeValue: AttributeValue) {
    return this.repo.save(attributeValue);
  }
}
