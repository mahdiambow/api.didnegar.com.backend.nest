import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity.js';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  create(data: Partial<Customer>) {
    return this.repo.create(data);
  }

  save(entity: Customer) {
    return this.repo.save(entity);
  }

  remove(entity: Customer) {
    return this.repo.remove(entity);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: {
      sellerId?: string | null;
      search?: string;
      phone?: string;
    } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('customer')
      .orderBy('customer.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.sellerId) {
      qb.andWhere('customer.sellerId = :sellerId', {
        sellerId: filters.sellerId,
      });
    }

    if (filters.phone) {
      qb.andWhere('customer.phone = :phone', { phone: filters.phone });
    }

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      qb.andWhere(
        `(customer.phone LIKE :q OR customer.firstName LIKE :q OR customer.lastName LIKE :q OR customer.email LIKE :q OR customer.username LIKE :q)`,
        { q },
      );
    }

    return qb.getManyAndCount();
  }
}
