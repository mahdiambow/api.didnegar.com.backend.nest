import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingMethod } from '../entities/shipping-method.entity.js';

@Injectable()
export class ShippingMethodRepository {
  constructor(
    @InjectRepository(ShippingMethod)
    private readonly repo: Repository<ShippingMethod>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id, isActive: true } });
  }

  findByIdAny(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findAllActive() {
    return this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  findPaginated(offset: number, limit: number, isActive?: boolean) {
    const where =
      isActive === undefined ? {} : { isActive };

    return this.repo.findAndCount({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  create(data: Partial<ShippingMethod>) {
    return this.repo.create(data);
  }

  save(method: ShippingMethod) {
    return this.repo.save(method);
  }

  remove(method: ShippingMethod) {
    return this.repo.remove(method);
  }

  countOrdersByShippingMethodId(shippingMethodId: string) {
    return this.repo.manager
      .createQueryBuilder()
      .from('orders', 'order')
      .where('order.shippingMethodId = :shippingMethodId', { shippingMethodId })
      .getCount();
  }
}
