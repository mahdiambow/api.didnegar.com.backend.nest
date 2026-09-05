import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, Repository } from 'typeorm';
import { Order } from '../../payments/entities/order.entity.js';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: {
        items: { product: true },
        payment: true,
        shippingMethod: true,
      },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.repo.findOne({
      where: { id, userId },
      relations: {
        items: { product: true },
        payment: true,
        shippingMethod: true,
      },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { status?: string; userId?: string } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('order.payment', 'payment')
      .orderBy('order.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.userId) {
      qb.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    return qb.getManyAndCount();
  }

  create(data: DeepPartial<Order>) {
    return this.repo.create(data);
  }

  save(order: Order) {
    return this.repo.save(order);
  }
}
