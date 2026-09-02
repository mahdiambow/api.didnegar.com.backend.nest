import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../entities/attribute.entity.js';

@Injectable()
export class AttributeRepository {
  constructor(
    @InjectRepository(Attribute) private readonly repo: Repository<Attribute>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithValues(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { values: true },
      order: { values: { value: 'ASC' } },
    });
  }

  findByName(name: string) {
    return this.repo.findOne({ where: { name } });
  }

  getNextLegacyId() {
    return this.repo.manager
      .createQueryBuilder()
      .select('COALESCE(MAX(attribute.legacyId), 0) + 1', 'next')
      .from(Attribute, 'attribute')
      .where('attribute.legacyTable = :table', { table: 'attributes' })
      .getRawOne<{ next: string }>()
      .then((row) => Number(row?.next ?? 1));
  }

  create(data: Partial<Attribute>) {
    return this.repo.create(data);
  }

  save(attribute: Attribute) {
    return this.repo.save(attribute);
  }

  remove(attribute: Attribute) {
    return this.repo.remove(attribute);
  }
}
