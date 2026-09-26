import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OffersService } from '../offers/offers.service.js';
import { ShippingService } from '../shipping/shipping.service.js';

const offerId = '01JEX000000000000000000010';
const secondId = '01JEX000000000000000000040';
const shippingMethodId = '01JEX000000000000000000030';
const addressId = '01JEX000000000000000000050';

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
    decrementStockForPurchase: vi.fn(async () => undefined),
  };
  const shipping = {
    resolveShippingMethod: vi.fn(async () => ({
      id: shippingMethodId,
      price: 50,
      isCod,
    })),
  };
  const dataSource = {
    transaction: vi.fn(async (cb: (manager: unknown) => Promise<unknown>) =>
      cb({
        getRepository: () => ({
          create: (data: unknown) => data,
          save: async (data: any) => {
            saved = { id: 'order', ...data };
            return saved;
          },
        }),
      }),
    ),
  };
  const deposits = {
    requestPayment: vi.fn(async () => ({
      paymentUrl: 'https://gateway.example/start/1',
      trackId: '123',
      depositId: 'dep1',
    })),
  };
  const shoppingCart = {
    get: vi.fn(async () => ({ items: [] })),
    clear: vi.fn(async () => undefined),
  };
  const addresses = {
    resolveForUser: vi.fn(async () => ({ id: addressId })),
  };
  const promotions = {
    applyToOrderInTransaction: vi.fn(),
  };
  const service = new OrdersService(
    dataSource as unknown as DataSource,
    repository as unknown as OrderRepository,
    products as unknown as OffersService,
    shipping as unknown as ShippingService,
    deposits as never,
    shoppingCart as never,
    addresses as never,
    promotions as never,
  );
  return {
    service,
    repository,
    products,
    dataSource,
    deposits,
    shoppingCart,
    addresses,
    promotions,
  };
}

describe('multi-product orders', () => {
  it.each([false, true])('charges shipping once, COD=%s', async (isCod) => {
    const { service, dataSource, products, shoppingCart } = setup(isCod);
    const result = await service.create('user', {
      products: [{ offerId, quantity: 2 }, { offerId: secondId }],
      shippingMethodId,
      addressId,
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
    expect(result.paymentUrl).toBe('https://gateway.example/start/1');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(products.decrementStockForPurchase).toHaveBeenCalled();
    expect(shoppingCart.clear).toHaveBeenCalledWith('user', expect.anything());
  });

  it('creates order from shopping cart items and clears cart', async () => {
    const { service, shoppingCart, products } = setup();
    shoppingCart.get.mockResolvedValueOnce({
      items: [
        { offerId, quantity: 2 },
        { offerId: secondId, quantity: 1 },
      ],
    });
    const result = await service.create('user', { shippingMethodId, addressId });
    expect(result.products).toHaveLength(2);
    expect(products.resolvePurchasable).toHaveBeenCalledWith(offerId, 2);
    expect(products.resolvePurchasable).toHaveBeenCalledWith(secondId, 1);
    expect(shoppingCart.clear).toHaveBeenCalled();
  });

  it('passes paymentMethod partial-bank to deposits', async () => {
    const { service, deposits } = setup();
    await service.create('user', {
      products: [{ offerId }],
      shippingMethodId,
      addressId,
      paymentMethod: 'partial-bank',
    });
    expect(deposits.requestPayment).toHaveBeenCalledWith(
      'user',
      'order',
      'partial-bank',
    );
  });

  it('does not save when any selected offer is unavailable', async () => {
    const { service, dataSource, products } = setup();
    products.resolvePurchasable.mockRejectedValueOnce(
      new Error('Offer unavailable'),
    );
    await expect(
      service.create('user', {
        products: [{ offerId }, { offerId: secondId }],
        shippingMethodId,
        addressId,
      }),
    ).rejects.toThrow();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('recalculates shipping using saved item prices and replaces products on update', async () => {
    const { service, products } = setup();
    await service.create('user', {
      products: [{ offerId, quantity: 2 }, { offerId: secondId }],
      shippingMethodId,
      addressId,
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

  it('rejects invalid create payloads before persistence', async () => {
    const errors = await validate(
      plainToInstance(CreateOrderDto, {
        products: [{ offerId: 'bad' }],
        shippingMethodId,
        addressId,
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});
