import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from '../entities/seller.entity.js';

@Injectable()
export class SellerRepository {
  constructor(
    @InjectRepository(Seller) private readonly repo: Repository<Seller>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findPaginatedForTenant(
    offset: number,
    limit: number,
    options: { sellerId: string | null; isSuperAdmin: boolean },
  ) {
    const qb = this.repo
      .createQueryBuilder('seller')
      .orderBy('seller.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (!options.isSuperAdmin && options.sellerId) {
      qb.andWhere('seller.id = :sellerId', { sellerId: options.sellerId });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<Seller>) {
    return this.repo.create(data);
  }

  save(seller: Seller) {
    return this.repo.save(seller);
  }

  remove(seller: Seller) {
    return this.repo.remove(seller);
  }
}
