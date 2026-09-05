import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderRepository } from './repositories/order.repository.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { ShippingService } from '../shipping/shipping.service.js';

const productId = '550e8400-e29b-41d4-a716-446655440000';
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
    findById: vi.fn(async (id) => ({
      id,
      status: 'publish',
      minPrice: id === productId ? 100 : 250,
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
    products as unknown as ProductRepository,
    shipping as unknown as ShippingService,
  );
  return { service, repository, products };
}

describe('multi-product orders', () => {
  it.each([false, true])('charges shipping once, COD=%s', async (isCod) => {
    const { service, repository } = setup(isCod);
    const result = await service.create('user', {
      products: [{ productId, quantity: 2 }, { productId: secondId }],
      shippingMethodId,
    });
    expect(result.products).toHaveLength(2);
    expect(result.products[1].quantity).toBe(1);
    expect(result.subtotal).toBe(450);
    expect(result.shippingAmount).toBe(50);
    expect(result.displayTotal).toBe(500);
    expect(result.amount).toBe(isCod ? 450 : 500);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it.each([
    null,
    { status: 'draft', minPrice: 100 },
    { status: 'publish', minPrice: 0 },
  ])('does not save if any product is invalid: %j', async (invalid) => {
    const { service, repository, products } = setup();
    products.findById
      .mockResolvedValueOnce({
        id: productId,
        status: 'publish',
        minPrice: 100,
      })
      .mockResolvedValueOnce(invalid as any);
    await expect(
      service.create('user', {
        products: [{ productId }, { productId: secondId }],
        shippingMethodId,
      }),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('recalculates shipping using saved item prices and replaces products on update', async () => {
    const { service, products } = setup();
    await service.create('user', {
      products: [{ productId, quantity: 2 }, { productId: secondId }],
      shippingMethodId,
    });
    products.findById.mockClear();
    const shippingUpdate = await service.updateAdmin('order', {
      shippingMethodId,
    });
    expect(shippingUpdate.amount).toBe(500);
    expect(products.findById).not.toHaveBeenCalled();
    const result = await service.updateAdmin('order', {
      products: [{ productId: secondId, quantity: 3 }],
    });
    expect(result.products).toHaveLength(1);
    expect(result.amount).toBe(800);
  });

  it.each([
    undefined,
    [],
    [{ productId: 'bad' }],
    [{ productId, quantity: 0 }],
    [{ productId, quantity: 1.5 }],
    [{ productId }, { productId }],
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
          products: [{ productId }],
          shippingMethodId,
        }),
      ),
    ).toEqual([]);
  });
});
