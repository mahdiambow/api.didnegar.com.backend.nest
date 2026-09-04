import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AttributeValue } from '../entities/attribute-value.entity.js';

@Injectable()
export class AttributeValueRepository {
  constructor(
    @InjectRepository(AttributeValue)
    private readonly repo: Repository<AttributeValue>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { attribute: true },
    });
  }

  findByAttributeAndSlug(attributeId: string, slug: string) {
    return this.repo.findOne({ where: { attributeId, slug } });
  }

  findBySlugWithoutAttribute(slug: string) {
    return this.repo.findOne({ where: { slug, attributeId: IsNull() } });
  }

  findByAttributeId(attributeId: string) {
    return this.repo.find({
      where: { attributeId },
      order: { value: 'ASC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { attributeId?: string },
  ) {
    const qb = this.repo
      .createQueryBuilder('value')
      .leftJoinAndSelect('value.attribute', 'attribute')
      .orderBy('value.value', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.attributeId) {
      qb.andWhere('value.attributeId = :attributeId', {
        attributeId: filters.attributeId,
      });
    }

    return qb.getManyAndCount();
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

  save(attributeValue: AttributeValue) {
    return this.repo.save(attributeValue);
  }

  remove(attributeValue: AttributeValue) {
    return this.repo.remove(attributeValue);
  }
}
