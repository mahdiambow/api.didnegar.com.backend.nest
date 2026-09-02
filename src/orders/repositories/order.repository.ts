import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../payments/entities/order.entity.js';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { product: true, payment: true, shippingMethod: true },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.repo.findOne({
      where: { id, userId },
      relations: { product: true, payment: true, shippingMethod: true },
    });
  }

  create(data: Partial<Order>) {
    return this.repo.create(data);
  }

  save(order: Order) {
    return this.repo.save(order);
  }
}
