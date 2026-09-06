import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OffersService, assertOfferAccess } from './offers.service.js';
import { SellerOffer } from './entities/seller-offer.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import {
  CreateSellerOfferDto,
  UpdateSellerOfferDto,
} from './dto/seller-offer.dto.js';
const sellerId = '550e8400-e29b-41d4-a716-446655440001';
const variantId = '550e8400-e29b-41d4-a716-446655440002';
const user = { sub: 'user', role: 'seller', sellerId };
const input = {
  sellerId,
  variantId,
  sku: 'SAM-BLU',
  price: 68000000,
  stockQuantity: 10,
  stockStatus: 'instock',
};
function setup(patch = {}) {
  const offer = {
    ...input,
    id: 'offer',
    isActive: true,
    seller: { status: 'active' },
    variant: { productId: 'product', product: { status: 'publish' } },
    ...patch,
  };
  const repo = {
    findOne: vi.fn(async () => offer),
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => data),
    delete: vi.fn(),
  };
  const service = new OffersService(
    repo as unknown as Repository<SellerOffer>,
    { existsBy: vi.fn(async () => true) } as unknown as Repository<Seller>,
    {
      existsBy: vi.fn(async () => true),
    } as unknown as Repository<ProductVariant>,
  );
  return { service, repo };
}
describe('seller offers', () => {
  it('allows only the owner and super-admin to mutate offers', () => {
    expect(() => assertOfferAccess(user, sellerId)).not.toThrow();
    expect(() =>
      assertOfferAccess(
        { ...user, role: 'super-admin', sellerId: null },
        sellerId,
      ),
    ).not.toThrow();
    expect(() => assertOfferAccess(user, 'another-seller')).toThrow();
    expect(() =>
      assertOfferAccess({ ...user, role: 'user' }, sellerId),
    ).toThrow();
    expect(() =>
      assertOfferAccess({ ...user, sellerId: null }, sellerId),
    ).toThrow();
  });
  it('does not write when a seller requests another seller offer', async () => {
    const { service, repo } = setup();
    await expect(
      service.create(user, { ...input, sellerId: 'another' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.update({ ...user, sellerId: 'another' }, 'offer', { price: 1 }),
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('returns the selected seller, SKU, variant and price for the order snapshot', async () => {
    const { service } = setup();
    expect(await service.resolvePurchasable('offer', 2)).toMatchObject({
      offerId: 'offer',
      sellerId,
      variantId,
      productId: 'product',
      sku: input.sku,
      unitPrice: input.price,
      quantity: 2,
    });
  });
  it.each([
    { isActive: false },
    { stockQuantity: 0 },
    { stockStatus: 'outofstock' },
    { seller: { status: 'suspended' } },
    { variant: { product: { status: 'draft' } } },
    { price: 0 },
    { price: NaN },
  ])('rejects unpurchasable offers %j', async (patch) => {
    await expect(
      setup(patch).service.resolvePurchasable('offer', 1),
    ).rejects.toThrow();
  });
  it('rejects insufficient stock and malformed quantities', async () => {
    for (const quantity of [11, 0, -1, 1.5])
      await expect(
        setup().service.resolvePurchasable('offer', quantity),
      ).rejects.toThrow();
  });
  it('maps duplicate seller/variant or seller/SKU to conflict', async () => {
    const { service, repo } = setup();
    repo.save.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create(user, input)).rejects.toMatchObject({
      status: 409,
    });
  });
  it.each([
    { price: -1 },
    { price: null },
    { stockQuantity: 1.5 },
    { stockStatus: 'wrong' },
    { sku: '' },
  ])('validates offer input %j', async (patch) => {
    expect(
      (
        await validate(
          plainToInstance(CreateSellerOfferDto, { ...input, ...patch }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
  it('accepts valid input and strips seller reassignment from updates', async () => {
    expect(
      await validate(plainToInstance(CreateSellerOfferDto, input)),
    ).toEqual([]);
    const dto = plainToInstance(UpdateSellerOfferDto, {
      sellerId: 'other',
      variantId: 'other',
      price: 70000000,
    });
    expect(await validate(dto, { whitelist: true })).toEqual([]);
    expect(dto).not.toHaveProperty('sellerId');
    expect(dto).not.toHaveProperty('variantId');
  });
});
