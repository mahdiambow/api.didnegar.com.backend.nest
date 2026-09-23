import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, Repository } from 'typeorm';
import {
  Order,
  ORDER_FULFILLMENT_STATUSES,
} from '../entities/order.entity.js';

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
        deposits: true,
        shippingMethod: true,
        address: true,
      },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.repo.findOne({
      where: { id, userId },
      relations: {
        items: { product: true },
        deposits: true,
        shippingMethod: true,
        address: true,
      },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: {
      status?: string;
      type?: string;
      userId?: string;
      customerId?: string;
    } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('order.deposits', 'deposit')
      .orderBy('order.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.type) {
      qb.andWhere('order.type = :type', { type: filters.type });
    }

    if (filters.userId) {
      qb.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    if (filters.customerId) {
      qb.andWhere('order.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    return qb.getManyAndCount();
  }

  /** کاربر این محصول را در سفارش پرداخت‌شده / در حال fulfillment خریده است؟ */
  async userHasPaidProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const row = await this.repo
      .createQueryBuilder('ord')
      .innerJoin('ord.items', 'item')
      .where('ord.userId = :userId', { userId })
      .andWhere('ord.status IN (:...statuses)', {
        statuses: [...ORDER_FULFILLMENT_STATUSES],
      })
      .andWhere('item.productId = :productId', { productId })
      .select('1')
      .limit(1)
      .getRawOne();
    return Boolean(row);
  }

  create(data: DeepPartial<Order>) {
    return this.repo.create(data);
  }

  save(order: Order) {
    return this.repo.save(order);
  }
}
