import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '../entities/deposit.entity.js';

@Injectable()
export class DepositRepository {
  constructor(
    @InjectRepository(Deposit) private readonly repo: Repository<Deposit>,
  ) {}

  findByTrackId(trackId: string) {
    if (!trackId) {
      return Promise.resolve(null);
    }
    return this.repo.findOne({
      where: { trackId },
      relations: {
        order: { items: { product: true }, shippingMethod: true },
      },
    });
  }

  findByOrderId(orderId: string) {
    return this.repo.findOne({ where: { orderId } });
  }

  create(data: Partial<Deposit>) {
    return this.repo.create(data);
  }

  save(deposit: Deposit) {
    return this.repo.save(deposit);
  }
}
