import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity.js';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
  ) {}

  findByAuthority(authority: string) {
    return this.repo.findOne({
      where: { authority },
      relations: {
        order: { product: true, shippingMethod: true },
      },
    });
  }

  findByOrderId(orderId: string) {
    return this.repo.findOne({ where: { orderId } });
  }

  create(data: Partial<Payment>) {
    return this.repo.create(data);
  }

  save(payment: Payment) {
    return this.repo.save(payment);
  }
}
