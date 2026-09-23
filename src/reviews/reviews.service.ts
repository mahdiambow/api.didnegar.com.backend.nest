import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { Review } from './entities/review.entity.js';
import {
  CreateReviewDto,
  ListReviewsQueryDto,
  ModerateReviewDto,
  toReviewResponse,
  type ReviewResponseDto,
} from './dto/review.dto.js';
import { assertReviewContentClean } from './helpers/review-content.helper.js';
import { ReviewRepository } from './repositories/review.repository.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async findByProduct(query: ListReviewsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [roots, total] =
      await this.reviewRepository.findApprovedRootsPaginated(
        query.productId,
        offset,
        limit,
      );

    const nested = await this.attachReplies(roots);
    return paginatedList(nested, page, limit, total);
  }

  async create(user: AuthUser, dto: CreateReviewDto) {
    const contentError = assertReviewContentClean(dto.content);
    if (contentError) {
      throw new ApiException(
        'REVIEW_CONTENT_FORBIDDEN',
        contentError,
        HttpStatus.BAD_REQUEST,
      );
    }

    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const parentId = dto.parentId?.trim() || null;
    let rating: number | null = dto.rating ?? null;

    if (parentId) {
      if (rating != null) {
        throw new ApiException(
          'RATING_NOT_ALLOWED_ON_REPLY',
          'امتیاز فقط برای نظر ریشه مجاز است',
          HttpStatus.BAD_REQUEST,
        );
      }
      rating = null;

      const parent = await this.reviewRepository.findById(parentId);
      if (!parent || parent.status === 'spam') {
        throw new ApiException(
          'PARENT_REVIEW_NOT_FOUND',
          'نظر والد یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      if (parent.productId !== dto.productId) {
        throw new ApiException(
          'PARENT_PRODUCT_MISMATCH',
          'نظر والد متعلق به این محصول نیست',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      const existing = await this.reviewRepository.findRootByUserAndProduct(
        user.sub,
        dto.productId,
      );
      if (existing) {
        throw new ApiException(
          'REVIEW_EXISTS',
          'برای این محصول قبلاً نظر ثبت کرده‌اید',
          HttpStatus.CONFLICT,
        );
      }

      const hasPurchased = await this.orderRepository.userHasPaidProduct(
        user.sub,
        dto.productId,
      );
      if (hasPurchased && (rating == null || rating < 1 || rating > 5)) {
        throw new ApiException(
          'RATING_REQUIRED',
          'چون این محصول را خریده‌اید، امتیاز (۱ تا ۵) الزامی است',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!hasPurchased && rating != null && (rating < 1 || rating > 5)) {
        throw new ApiException(
          'RATING_INVALID',
          'امتیاز باید بین ۱ تا ۵ باشد',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!hasPurchased && rating == null) {
        rating = null;
      }
    }

    const legacyId = await this.reviewRepository.getNextLegacyId();
    const saved = await this.reviewRepository.save(
      this.reviewRepository.create({
        legacyId,
        legacyTable: 'reviews',
        productId: dto.productId,
        userId: user.sub,
        authorName: null,
        authorEmail: null,
        authorUrl: null,
        authorIp: null,
        content: dto.content.trim(),
        status: 'approved',
        parentId,
        rating,
      }),
    );

    if (!parentId && rating != null) {
      await this.refreshProductRating(dto.productId);
    }

    const loaded = await this.reviewRepository.findById(saved.id);
    return toReviewResponse(loaded!, []);
  }

  async moderate(id: string, dto: ModerateReviewDto) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new ApiException(
        'REVIEW_NOT_FOUND',
        'نظر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const wasRatedRoot =
      review.parentId == null &&
      review.rating != null &&
      review.status === 'approved';
    review.status = dto.status;
    await this.reviewRepository.save(review);

    const isRatedRoot = review.parentId == null && review.rating != null;
    if (wasRatedRoot || (isRatedRoot && dto.status === 'approved')) {
      await this.refreshProductRating(review.productId);
    }

    const loaded = await this.reviewRepository.findById(review.id);
    return toReviewResponse(loaded!, []);
  }

  async remove(user: AuthUser, id: string, asAdmin: boolean) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new ApiException(
        'REVIEW_NOT_FOUND',
        'نظر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!asAdmin && review.userId !== user.sub) {
      throw new ApiException(
        'REVIEW_FORBIDDEN',
        'اجازه حذف این نظر را ندارید',
        HttpStatus.FORBIDDEN,
      );
    }

    const shouldRefresh =
      review.parentId == null &&
      review.rating != null &&
      review.status === 'approved';
    const productId = review.productId;

    await this.reviewRepository.remove(review);

    if (shouldRefresh) {
      await this.refreshProductRating(productId);
    }

    return {};
  }

  /** همه سطوح پاسخ‌های approved را زیر ریشه‌ها بارگذاری می‌کند */
  private async attachReplies(
    roots: Review[],
  ): Promise<ReviewResponseDto[]> {
    if (roots.length === 0) return [];

    const childrenByParent = new Map<string, Review[]>();
    let frontier = roots.map((review) => review.id);

    while (frontier.length > 0) {
      const replies =
        await this.reviewRepository.findApprovedRepliesByParentIds(frontier);
      if (replies.length === 0) break;

      frontier = [];
      for (const reply of replies) {
        if (!reply.parentId) continue;
        const list = childrenByParent.get(reply.parentId) ?? [];
        list.push(reply);
        childrenByParent.set(reply.parentId, list);
        frontier.push(reply.id);
      }
    }

    const mapNode = (review: Review): ReviewResponseDto =>
      toReviewResponse(
        review,
        (childrenByParent.get(review.id) ?? []).map(mapNode),
      );

    return roots.map(mapNode);
  }

  private async refreshProductRating(productId: string) {
    const stats = await this.reviewRepository.getApprovedRatingStats(productId);
    const product = await this.productRepository.findById(productId);
    if (!product) return;
    product.ratingCount = stats.count;
    product.averageRating = Number(stats.average.toFixed(2));
    await this.productRepository.save(product);
  }
}
