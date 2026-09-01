import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerContract } from '../entities/seller-contract.entity.js';

@Injectable()
export class SellerContractRepository {
  constructor(
    @InjectRepository(SellerContract)
    private readonly repo: Repository<SellerContract>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findLatestBySellerId(sellerId: string) {
    return this.repo.findOne({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  findPaginatedForTenant(
    offset: number,
    limit: number,
    options: {
      sellerId: string | null;
      isSuperAdmin: boolean;
      filterSellerId?: string;
    },
  ) {
    const qb = this.repo
      .createQueryBuilder('contract')
      .orderBy('contract.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (options.filterSellerId) {
      qb.andWhere('contract.sellerId = :filterSellerId', {
        filterSellerId: options.filterSellerId,
      });
    } else if (!options.isSuperAdmin && options.sellerId) {
      qb.andWhere('contract.sellerId = :sellerId', {
        sellerId: options.sellerId,
      });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<SellerContract>) {
    return this.repo.create(data);
  }

  save(contract: SellerContract) {
    return this.repo.save(contract);
  }

  remove(contract: SellerContract) {
    return this.repo.remove(contract);
  }
}
