import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  findByIds(ids: string[]) {
    if (!ids.length) return Promise.resolve([] as AttributeValue[]);
    return this.repo.find({ where: { id: In(ids) } });
  }

  findByAttributeId(attributeId: string) {
    return this.repo.find({
      where: { attributeId },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  findByAttributeIds(attributeIds: string[]) {
    if (!attributeIds.length) return Promise.resolve([] as AttributeValue[]);
    return this.repo.find({
      where: { attributeId: In(attributeIds) },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { attributeId?: string; isActive?: boolean } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('value')
      .orderBy('value.sortOrder', 'ASC')
      .addOrderBy('value.label', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.attributeId) {
      qb.andWhere('value.attributeId = :attributeId', {
        attributeId: filters.attributeId,
      });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('value.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return qb.getManyAndCount();
  }

  findByAttributeAndValue(attributeId: string, value: string) {
    return this.repo.findOne({ where: { attributeId, value } });
  }

  countByAttributeId(attributeId: string) {
    return this.repo.count({ where: { attributeId } });
  }

  getNextLegacyId() {
    return this.repo.manager
      .createQueryBuilder()
      .select('COALESCE(MAX(value.legacyId), 0) + 1', 'next')
      .from(AttributeValue, 'value')
      .where('value.legacyTable = :table', { table: 'attribute_values' })
      .getRawOne<{ next: string }>()
      .then((row) => Number(row?.next ?? 1));
  }

  create(data: Partial<AttributeValue>) {
    return this.repo.create(data);
  }

  save(value: AttributeValue) {
    return this.repo.save(value);
  }

  remove(value: AttributeValue) {
    return this.repo.remove(value);
  }
}
