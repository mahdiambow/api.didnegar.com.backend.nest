import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, type DeepPartial, Repository } from 'typeorm';
import { Review } from '../entities/review.entity.js';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { user: true, replies: true },
    });
  }

  findRootByUserAndProduct(userId: string, productId: string) {
    return this.repo.findOne({
      where: { userId, productId, parentId: IsNull() },
    });
  }

  findRootByUserAndOffer(userId: string, offerId: string) {
    return this.repo.findOne({
      where: { userId, offerId, parentId: IsNull() },
    });
  }

  async getNextLegacyId(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('review')
      .select('COALESCE(MAX(review.legacyId), 0) + 1', 'next')
      .where('review.legacyTable = :table', { table: 'reviews' })
      .getRawOne<{ next: string }>();
    return Number(result?.next ?? 1);
  }

  findApprovedRootsPaginated(
    productId: string,
    offset: number,
    limit: number,
  ) {
    return this.repo.findAndCount({
      where: {
        productId,
        parentId: IsNull(),
        status: 'approved',
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  findApprovedRepliesByParentIds(parentIds: string[]) {
    if (parentIds.length === 0) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.parentId IN (:...parentIds)', { parentIds })
      .andWhere('review.status = :status', { status: 'approved' })
      .orderBy('review.createdAt', 'ASC')
      .getMany();
  }

  async getApprovedRatingStats(productId: string) {
    const result = await this.repo
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'count')
      .addSelect('AVG(review.rating)', 'avg')
      .where('review.productId = :productId', { productId })
      .andWhere('review.parentId IS NULL')
      .andWhere('review.status = :status', { status: 'approved' })
      .andWhere('review.rating IS NOT NULL')
      .getRawOne<{ count: string; avg: string | null }>();

    return {
      count: Number(result?.count ?? 0),
      average: result?.avg != null ? Number(result.avg) : 0,
    };
  }

  create(data: DeepPartial<Review>) {
    return this.repo.create(data);
  }

  save(review: Review) {
    return this.repo.save(review);
  }

  remove(review: Review) {
    return this.repo.remove(review);
  }
}
