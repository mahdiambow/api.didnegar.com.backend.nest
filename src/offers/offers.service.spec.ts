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

const sellerId = '01JEX000000000000000000030';
const productId = '01JEX000000000000000000040';
const productId2 = '01JEX000000000000000000050';
const user = { sub: 'user', role: 'seller', roles: ['seller'], sellerId };
const item = {
  productId,
  sku: 'SAM-BLU',
  price: 68000000,
  stock: 10,
  stockStatus: 'instock',
};
const input = { items: [item] };

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
    existsBy: vi.fn(async () => false),
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
    save: vi.fn(async (data) => data),
  };
  const productsService = {
    update: vi.fn(async () => ({ id: productId })),
    create: vi.fn(async (dto: { name: string; sku: string }) => ({
      id: '01JEX000000000000000000099',
      name: dto.name,
      sku: dto.sku,
      status: 'draft',
      approvalStatus: 'pending',
    })),
    findOne: vi.fn(async () => ({
      id: productId,
      name: 'Galaxy',
      status: 'publish',
      approvalStatus: 'approved',
    })),
  };
  const productStockRepository = {
    tryDecrement: vi.fn(async () => true),
    tryIncrement: vi.fn(async () => true),
    findByProductId: vi.fn(async () => ({ stock: 10 })),
  };
  const service = new OffersService(
    repo as unknown as Repository<SellerOffer>,
    { existsBy: vi.fn(async () => true) } as unknown as Repository<Seller>,
    products as unknown as Repository<Product>,
    productsService as never,
    productStockRepository as never,
  );
  return { service, repo, products, productsService, productStockRepository };
}

describe('seller offers', () => {
  it('allows only the owner and super-admin to mutate offers', () => {
    expect(() => assertOfferAccess(user, sellerId)).not.toThrow();
    expect(() =>
      assertOfferAccess(
        { ...user, role: 'super-admin', roles: ['super-admin'], sellerId: null },
        sellerId,
      ),
    ).not.toThrow();
    expect(() => assertOfferAccess(user, 'another-seller')).toThrow();
  });

  it('rejects create when jwt has no sellerId', async () => {
    const { service, repo } = setup();
    await expect(
      service.create(
        { ...user, sellerId: null },
        { items: [item] },
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not write when a seller updates another seller offer', async () => {
    const { service, repo } = setup();
    await expect(
      service.update({ ...user, sellerId: 'another' }, 'offer', { price: 1 }),
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates multiple offers in one request', async () => {
    const { service, repo } = setup();
    const result = await service.create(user, {
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

  it('updates product catalog fields when product patch is provided', async () => {
    const { service, productsService } = setup();
    await service.create(user, {
      items: [
        {
          ...item,
          product: {
            name: 'گوشی جدید',
            subtitle: 'آپدیت از آفر',
            description: 'توضیح کامل',
          },
        },
      ],
    });
    expect(productsService.update).toHaveBeenCalledWith(productId, {
      name: 'گوشی جدید',
      subtitle: 'آپدیت از آفر',
      description: 'توضیح کامل',
    });
  });

  it('creates catalog product when productId is missing', async () => {
    const { service, productsService, products, repo } = setup();
    products.findOneBy.mockResolvedValueOnce({
      id: '01JEX000000000000000000099',
      status: 'draft',
      approvalStatus: 'pending',
    });

    const result = await service.create(user, {
      items: [
        {
          sku: 'NEW-SKU-1',
          price: 1000,
          stock: 2,
          stockStatus: 'instock',
          product: { name: 'محصول جدید', slug: 'new-product' },
        },
      ],
    });

    expect(productsService.create).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: '01JEX000000000000000000099',
        sku: 'NEW-SKU-1',
        approvalStatus: 'pending',
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('creates catalog product when productId is not found', async () => {
    const { service, productsService, products } = setup();
    products.findBy.mockResolvedValueOnce([]);
    products.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: '01JEX000000000000000000099',
        status: 'draft',
        approvalStatus: 'pending',
      });

    await service.create(user, {
      items: [
        {
          productId: '01JEX000000000000000000077',
          sku: 'MISSING-PROD',
          price: 5000,
          stock: 1,
          stockStatus: 'instock',
          product: { name: 'از آفر', slug: 'from-offer' },
        },
      ],
    });

    expect(productsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'از آفر',
        slug: 'from-offer',
        sku: 'MISSING-PROD',
        sellerIds: [sellerId],
        approvalStatus: 'pending',
      }),
      { createSellerOffer: false },
    );
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

  it('applies price updates immediately without touching catalog product', async () => {
    expect(isImmediateOfferUpdate({ price: 70000000 })).toBe(true);
    const { service, productsService } = setup();
    const result = await service.update(user, 'offer', { price: 70000000 });
    expect(result.approvalStatus).toBe('approved');
    expect(result.price).toBe(70000000);
    expect(productsService.update).not.toHaveBeenCalled();
  });

  it('updates approvalStatus on offer only when provided', async () => {
    const { service, productsService, products } = setup();
    products.findOneBy.mockResolvedValue({
      id: productId,
      status: 'draft',
      approvalStatus: 'pending',
    });
    const result = await service.update(user, 'offer', {
      price: 1,
      approvalStatus: 'approved',
      product: { name: 'should-not-update-catalog' },
    });
    expect(result.approvalStatus).toBe('approved');
    expect(productsService.update).not.toHaveBeenCalled();
    expect(products.save).not.toHaveBeenCalled();
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
          plainToInstance(CreateSellerOffersDto, { items: [] }),
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
