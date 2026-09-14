import { Injectable } from '@nestjs/common';
import { AttributeRepository } from './repositories/attribute.repository.js';
import { AttributeValueRepository } from './repositories/attribute-value.repository.js';

const SEED_ATTRIBUTES = [
  {
    name: 'storage',
    label: 'حافظه',
    isPublic: true,
    legacyId: 1,
    values: [
      { value: '128gb', label: '۱۲۸ گیگابایت', sortOrder: 1, legacyId: 1 },
      { value: '256gb', label: '۲۵۶ گیگابایت', sortOrder: 2, legacyId: 2 },
      { value: '512gb', label: '۵۱۲ گیگابایت', sortOrder: 3, legacyId: 3 },
    ],
  },
  {
    name: 'color',
    label: 'رنگ',
    isPublic: true,
    legacyId: 2,
    values: [
      { value: 'black', label: 'مشکی', sortOrder: 1, legacyId: 4 },
      { value: 'white', label: 'سفید', sortOrder: 2, legacyId: 5 },
      { value: 'blue', label: 'آبی', sortOrder: 3, legacyId: 6 },
    ],
  },
] as const;

@Injectable()
export class AttributesSeedService {
  constructor(
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async seed() {
    for (const attributeSeed of SEED_ATTRIBUTES) {
      let attribute = await this.attributeRepository.findByName(
        attributeSeed.name,
      );
      if (!attribute) {
        attribute = await this.attributeRepository.save(
          this.attributeRepository.create({
            legacyId: attributeSeed.legacyId,
            legacyTable: 'attributes',
            name: attributeSeed.name,
            label: attributeSeed.label,
            isPublic: attributeSeed.isPublic,
          }),
        );
      }

      for (const valueSeed of attributeSeed.values) {
        const existing =
          await this.attributeValueRepository.findByAttributeAndValue(
            attribute.id,
            valueSeed.value,
          );
        if (existing) continue;

        await this.attributeValueRepository.save(
          this.attributeValueRepository.create({
            legacyId: valueSeed.legacyId,
            legacyTable: 'attribute_values',
            attributeId: attribute.id,
            value: valueSeed.value,
            label: valueSeed.label,
            sortOrder: valueSeed.sortOrder,
            isActive: true,
          }),
        );
      }
    }
  }
}
