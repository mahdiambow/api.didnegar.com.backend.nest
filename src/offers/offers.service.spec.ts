import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  OffersService,
  assertOfferAccess,
  isImmediateOfferUpdate,
} from './offers.service.js';
import { SellerOffer } from './entities/seller-offer.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { Product } from '../products/entities/product.entity.js';
import {
  CreateSellerOffersDto,
  UpdateSellerOfferDto,
} from './dto/seller-offer.dto.js';

const sellerId = '550e8400-e29b-41d4-a716-446655440001';
const productId = '550e8400-e29b-41d4-a716-446655440002';
const productId2 = '550e8400-e29b-41d4-a716-446655440003';
const user = { sub: 'user', role: 'seller', sellerId };
const item = {
  productId,
  sku: 'SAM-BLU',
  price: 68000000,
  stock: 10,
  stockStatus: 'instock',
};
const input = { sellerId, items: [item] };

function setup(patch = {}) {
  const offer = {
    ...item,
    sellerId,
    id: 'offer',
    attributes: {},
    isActive: true,
    approvalStatus: 'approved',
    seller: { status: 'active' },
    product: {
      id: productId,
      status: 'publish',
      approvalStatus: 'approved',
    },
    ...patch,
  };
  const repo = {
    findOne: vi.fn(async () => offer),
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => ({ ...offer, ...data, id: data.id ?? 'offer' })),
    delete: vi.fn(),
  };
  const products = {
    existsBy: vi.fn(async () => true),
    findBy: vi.fn(async () => [
      { id: productId, status: 'publish', approvalStatus: 'approved' },
      { id: productId2, status: 'publish', approvalStatus: 'approved' },
    ]),
    findOneBy: vi.fn(async () => ({
      id: productId,
      status: 'publish',
      approvalStatus: 'approved',
    })),
  };
  const service = new OffersService(
    repo as unknown as Repository<SellerOffer>,
    { existsBy: vi.fn(async () => true) } as unknown as Repository<Seller>,
    products as unknown as Repository<Product>,
  );
  return { service, repo, products };
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

  it('creates multiple offers in one request', async () => {
    const { service, repo } = setup();
    const result = await service.create(user, {
      sellerId,
      items: [
        item,
        {
          ...item,
          productId: productId2,
          sku: 'SAM-RED',
          price: 70000000,
        },
      ],
    });
    expect(result).toHaveLength(2);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('returns purchasable snapshot', async () => {
    const { service } = setup();
    expect(await service.resolvePurchasable('offer', 2)).toMatchObject({
      offerId: 'offer',
      sellerId,
      productId,
      sku: item.sku,
      unitPrice: item.price,
      quantity: 2,
    });
  });

  it('applies price updates immediately', async () => {
    expect(isImmediateOfferUpdate({ price: 70000000 })).toBe(true);
    const { service } = setup();
    const result = await service.update(user, 'offer', { price: 70000000 });
    expect(result.approvalStatus).toBe('approved');
    expect(result.price).toBe(70000000);
  });

  it('maps duplicate seller/SKU to conflict', async () => {
    const { service, repo } = setup();
    repo.save.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create(user, input)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('rejects duplicate skus in the same request', async () => {
    const { service } = setup();
    await expect(
      service.create(user, {
        sellerId,
        items: [item, { ...item, productId: productId2 }],
      }),
    ).rejects.toMatchObject({
      response: { code: 'OFFER_SKU_DUPLICATE' },
    });
  });

  it('validates bulk create dto', async () => {
    expect(
      await validate(plainToInstance(CreateSellerOffersDto, input)),
    ).toEqual([]);
    expect(
      (
        await validate(
          plainToInstance(CreateSellerOffersDto, { sellerId, items: [] }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });

  it('strips product reassignment from updates', async () => {
    const dto = plainToInstance(UpdateSellerOfferDto, {
      productId: 'other',
      price: 70000000,
    });
    expect(await validate(dto, { whitelist: true })).toEqual([]);
    expect(dto).not.toHaveProperty('productId');
  });
});
