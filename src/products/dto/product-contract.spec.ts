import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';
import { UpdateProductDto } from './update-product.dto.js';
import { toProductResponse } from './product-response.dto.js';
import { toProductEntityData } from './product-fields.dto.js';
import { Product } from '../entities/product.entity.js';

const removed = {
  minPrice: 100,
  maxPrice: 200,
  stockQuantity: 5,
  stockStatus: 'instock',
  isOnSale: true,
  variantIds: ['legacy-variant'],
};
const general = {
  name: 'گوشی Galaxy S24',
  slug: 'galaxy-s24',
  description: 'توضیحات',
  shortDescription: 'خلاصه',
  sku: 'SAM-S24U-256',
  status: 'publish',
  isVirtual: false,
  isDownloadable: false,
  taxStatus: 'taxable',
  taxClass: 'standard',
  weight: 0.2,
  length: 15,
  width: 7,
  height: 0.8,
  brandId: '550e8400-e29b-41d4-a716-446655440001',
  categoryIds: ['550e8400-e29b-41d4-a716-446655440011'],
};

describe('general product contract', () => {
  it.each([CreateProductDto, UpdateProductDto])(
    'strips obsolete fields from %s while accepting general fields',
    async (Dto) => {
      const dto = plainToInstance(Dto, { ...general, ...removed });
      expect(await validate(dto, { whitelist: true })).toEqual([]);
      expect(dto).toMatchObject(general);
      for (const field of Object.keys(removed))
        expect(dto).not.toHaveProperty(field);
    },
  );

  it('does not map obsolete fields into a new product or return them from a legacy record', () => {
    const data = toProductEntityData({ ...general, ...removed }, 1);
    const response = toProductResponse(
      { ...data, ...removed, variants: [] } as unknown as Product,
      true,
    );
    for (const field of Object.keys(removed)) {
      expect(data).not.toHaveProperty(field);
      expect(response).not.toHaveProperty(field);
    }
    expect(response.name).toBe(general.name);
    expect(response.sku).toBe(general.sku);
  });
});
