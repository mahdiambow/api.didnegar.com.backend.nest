import { Injectable, OnModuleInit } from '@nestjs/common';
import { AttributeRepository } from './repositories/attribute.repository.js';
import { AttributeValueRepository } from './repositories/attribute-value.repository.js';

const SEED_ATTRIBUTES = [
  {
    name: 'storage',
    label: 'حافظه',
    isPublic: true,
    legacyId: 1,
    values: [
      { slug: '256gb', value: '256GB', legacyId: 1 },
      { slug: '512gb', value: '512GB', legacyId: 2 },
    ],
  },
  {
    name: 'color',
    label: 'رنگ',
    isPublic: true,
    legacyId: 2,
    values: [
      { slug: 'black', value: 'مشکی', legacyId: 3 },
      { slug: 'titanium', value: 'تیتانیوم', legacyId: 4 },
    ],
  },
] as const;

@Injectable()
export class AttributesSeedService implements OnModuleInit {
  constructor(
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async onModuleInit() {
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
          await this.attributeValueRepository.findByAttributeAndSlug(
            attribute.id,
            valueSeed.slug,
          );
        if (existing) continue;

        await this.attributeValueRepository.save(
          this.attributeValueRepository.create({
            legacyId: valueSeed.legacyId,
            legacyTable: 'attribute_values',
            attributeId: attribute.id,
            slug: valueSeed.slug,
            value: valueSeed.value,
          }),
        );
      }
    }
  }
}
