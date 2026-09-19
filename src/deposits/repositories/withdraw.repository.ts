import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Withdraw,
  type WithdrawStatus,
} from '../entities/withdraw.entity.js';

@Injectable()
export class WithdrawRepository {
  constructor(
    @InjectRepository(Withdraw) private readonly repo: Repository<Withdraw>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { userId?: string; status?: WithdrawStatus } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('withdraw')
      .orderBy('withdraw.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.userId) {
      qb.andWhere('withdraw.userId = :userId', { userId: filters.userId });
    }
    if (filters.status) {
      qb.andWhere('withdraw.status = :status', { status: filters.status });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<Withdraw>) {
    return this.repo.create(data);
  }

  save(withdraw: Withdraw) {
    return this.repo.save(withdraw);
  }
}
