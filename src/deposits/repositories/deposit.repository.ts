import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit, type DepositStatus } from '../entities/deposit.entity.js';

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
        user: true,
      },
    });
  }

  findByOrderId(orderId: string) {
    return this.repo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { userId?: string; status?: DepositStatus } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('deposit')
      .orderBy('deposit.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.userId) {
      qb.andWhere('deposit.userId = :userId', { userId: filters.userId });
    }
    if (filters.status) {
      qb.andWhere('deposit.status = :status', { status: filters.status });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<Deposit>) {
    return this.repo.create(data);
  }

  save(deposit: Deposit) {
    return this.repo.save(deposit);
  }
}
