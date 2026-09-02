import { Injectable } from '@nestjs/common';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';

const DEFAULT_SHIPPING_METHODS = [
  {
    slug: 'mahex-cod',
    name: 'ماهکس (پس کرایه)',
    price: 85000,
    isCod: true,
    sortOrder: 1,
  },
  {
    slug: 'tipax-cod',
    name: 'تیپاکس (پس کرایه)',
    price: 75000,
    isCod: true,
    sortOrder: 2,
  },
  {
    slug: 'freight-cod',
    name: 'باربری (پس کرایه)',
    price: 120000,
    isCod: true,
    sortOrder: 3,
  },
  {
    slug: 'terminal-cod',
    name: 'ترمینال (پس کرایه)',
    price: 95000,
    isCod: true,
    sortOrder: 4,
  },
  {
    slug: 'boxit-cod',
    name: 'باکسیت (پس کرایه)',
    price: 65000,
    isCod: true,
    sortOrder: 5,
  },
  {
    slug: 'tehran-delivery',
    name: 'حمل و نقل به تهران',
    price: 45000,
    isCod: false,
    sortOrder: 6,
  },
] as const;

@Injectable()
export class ShippingSeedService {
  constructor(
    private readonly shippingMethodRepository: ShippingMethodRepository,
  ) {}

  async seed() {
    for (const method of DEFAULT_SHIPPING_METHODS) {
      const existing = await this.shippingMethodRepository.findBySlug(
        method.slug,
      );
      if (existing) {
        continue;
      }

      await this.shippingMethodRepository.save(
        this.shippingMethodRepository.create({
          slug: method.slug,
          name: method.name,
          price: method.price,
          isCod: method.isCod,
          sortOrder: method.sortOrder,
          isActive: true,
        }),
      );
    }
  }
}
