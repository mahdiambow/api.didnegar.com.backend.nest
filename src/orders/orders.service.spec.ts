import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OffersService } from '../offers/offers.service.js';
import { ShippingService } from '../shipping/shipping.service.js';

const offerId = '550e8400-e29b-41d4-a716-446655440000';
const secondId = '550e8400-e29b-41d4-a716-446655440002';
const shippingMethodId = '550e8400-e29b-41d4-a716-446655440001';

function setup(isCod = false) {
  let saved: any;
  const repository = {
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => (saved = { id: 'order', ...data })),
    findById: vi.fn(async () => saved),
  };
  const products = {
    resolvePurchasable: vi.fn(async (id, quantity) => ({
      offerId: id,
      productId: 'same-product',
      variantId: 'same-variant',
      sellerId: id,
      sku: 'SKU',
      quantity,
      unitPrice: id === offerId ? 100 : 250,
    })),
  };
  const shipping = {
    resolveShippingMethod: vi.fn(async () => ({
      id: shippingMethodId,
      price: 50,
      isCod,
    })),
  };
  const service = new OrdersService(
    repository as unknown as OrderRepository,
    products as unknown as OffersService,
    shipping as unknown as ShippingService,
  );
  return { service, repository, products };
}

describe('multi-product orders', () => {
  it.each([false, true])('charges shipping once, COD=%s', async (isCod) => {
    const { service, repository } = setup(isCod);
    const result = await service.create('user', {
      products: [{ offerId, quantity: 2 }, { offerId: secondId }],
      shippingMethodId,
    });
    expect(result.products).toHaveLength(2);
    expect(result.products.map((item) => item.offerId)).toEqual([
      offerId,
      secondId,
    ]);
    expect(result.products[0].sellerId).not.toBe(result.products[1].sellerId);
    expect(result.products[1].quantity).toBe(1);
    expect(result.subtotal).toBe(450);
    expect(result.shippingAmount).toBe(50);
    expect(result.displayTotal).toBe(500);
    expect(result.amount).toBe(isCod ? 450 : 500);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('does not save when any selected offer is unavailable', async () => {
    const { service, repository, products } = setup();
    products.resolvePurchasable.mockRejectedValueOnce(
      new Error('Offer unavailable'),
    );
    await expect(
      service.create('user', {
        products: [{ offerId }, { offerId: secondId }],
        shippingMethodId,
      }),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('recalculates shipping using saved item prices and replaces products on update', async () => {
    const { service, products } = setup();
    await service.create('user', {
      products: [{ offerId, quantity: 2 }, { offerId: secondId }],
      shippingMethodId,
    });
    products.resolvePurchasable.mockClear();
    const shippingUpdate = await service.updateAdmin('order', {
      shippingMethodId,
    });
    expect(shippingUpdate.amount).toBe(500);
    expect(products.resolvePurchasable).not.toHaveBeenCalled();
    const result = await service.updateAdmin('order', {
      products: [{ offerId: secondId, quantity: 3 }],
    });
    expect(result.products).toHaveLength(1);
    expect(result.amount).toBe(800);
  });

  it.each([
    undefined,
    [],
    [{ offerId: 'bad' }],
    [{ offerId, quantity: 0 }],
    [{ offerId, quantity: 1.5 }],
    [{ offerId }, { offerId }],
    [null],
  ])('rejects malformed products: %j', async (products) => {
    const errors = await validate(
      plainToInstance(CreateOrderDto, { products, shippingMethodId }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts products with optional quantities', async () => {
    expect(
      await validate(
        plainToInstance(CreateOrderDto, {
          products: [{ offerId }],
          shippingMethodId,
        }),
      ),
    ).toEqual([]);
  });
});
