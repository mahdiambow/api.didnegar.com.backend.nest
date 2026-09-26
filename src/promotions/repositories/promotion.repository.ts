import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../entities/promotion.entity.js';
import { PromotionUsage } from '../entities/promotion-usage.entity.js';

@Injectable()
export class PromotionRepository {
  constructor(
    @InjectRepository(Promotion)
    private readonly repo: Repository<Promotion>,
    @InjectRepository(PromotionUsage)
    private readonly usageRepo: Repository<PromotionUsage>,
  ) {}

  create(data: Partial<Promotion>) {
    return this.repo.create(data);
  }

  save(entity: Promotion) {
    return this.repo.save(entity);
  }

  remove(entity: Promotion) {
    return this.repo.remove(entity);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string) {
    return this.repo.findOne({
      where: { code: code.trim().toUpperCase() },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: {
      search?: string;
      isActive?: boolean;
      discountType?: string;
    } = {},
  ) {
    const qb = this.repo
      .createQueryBuilder('promo')
      .orderBy('promo.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.isActive !== undefined) {
      qb.andWhere('promo.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }
    if (filters.discountType) {
      qb.andWhere('promo.discountType = :discountType', {
        discountType: filters.discountType,
      });
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      qb.andWhere(
        '(promo.name LIKE :q OR promo.code LIKE :q OR promo.description LIKE :q)',
        { q },
      );
    }

    return qb.getManyAndCount();
  }

  countUserUsages(promotionId: string, userId: string) {
    return this.usageRepo.count({ where: { promotionId, userId } });
  }

  async sumUserDiscountAmount(
    promotionId: string,
    userId: string,
  ): Promise<number> {
    const raw = await this.usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.discountAmount), 0)', 'total')
      .where('u.promotionId = :promotionId', { promotionId })
      .andWhere('u.userId = :userId', { userId })
      .getRawOne<{ total: string }>();
    return Number(raw?.total ?? 0);
  }

  createUsage(data: Partial<PromotionUsage>) {
    return this.usageRepo.create(data);
  }

  saveUsage(entity: PromotionUsage) {
    return this.usageRepo.save(entity);
  }

  getUsageRepo() {
    return this.usageRepo;
  }

  getRepo() {
    return this.repo;
  }
}
