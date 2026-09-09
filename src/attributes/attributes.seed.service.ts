import { Injectable } from '@nestjs/common';
import { AttributeRepository } from './repositories/attribute.repository.js';

const SEED_ATTRIBUTES = [
  {
    name: 'storage',
    label: 'حافظه',
    isPublic: true,
    legacyId: 1,
  },
  {
    name: 'color',
    label: 'رنگ',
    isPublic: true,
    legacyId: 2,
  },
] as const;

@Injectable()
export class AttributesSeedService {
  constructor(private readonly attributeRepository: AttributeRepository) {}

  async seed() {
    for (const attributeSeed of SEED_ATTRIBUTES) {
      const existing = await this.attributeRepository.findByName(
        attributeSeed.name,
      );
      if (existing) continue;

      await this.attributeRepository.save(
        this.attributeRepository.create({
          legacyId: attributeSeed.legacyId,
          legacyTable: 'attributes',
          name: attributeSeed.name,
          label: attributeSeed.label,
          isPublic: attributeSeed.isPublic,
        }),
      );
    }
  }
}
