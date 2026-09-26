import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Promotion } from './entities/promotion.entity.js';
import { PromotionUsage } from './entities/promotion-usage.entity.js';
import { PromotionRepository } from './repositories/promotion.repository.js';
import {
  CreatePromotionDto,
  ListPromotionsQueryDto,
  PreviewPromotionDto,
  UpdatePromotionDto,
  toPromotionResponse,
  type PromotionPreviewResponseDto,
} from './dto/promotion.dto.js';

export type AppliedPromotion = {
  promotionId: string;
  code: string | null;
  discountAmount: number;
  discountPrice: number;
  orderAmount: number;
};

@Injectable()
export class PromotionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly promotions: PromotionRepository,
  ) {}

  async findAll(query: ListPromotionsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.promotions.findPaginated(offset, limit, {
      search: query.search,
      isActive: query.isActive,
      discountType: query.discountType,
    });
    return paginatedList(
      items.map(toPromotionResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    return toPromotionResponse(await this.requireById(id));
  }

  async create(dto: CreatePromotionDto) {
    this.assertDiscountValue(dto.discountType, dto.discountValue);
    const code = this.normalizeCode(dto.code);
    if (code) await this.ensureCodeUnique(code);

    const saved = await this.promotions.save(
      this.promotions.create({
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        discountPrice: dto.discountPrice ?? null,
        discountStartAt: dto.discountStartAt
          ? new Date(dto.discountStartAt)
          : null,
        discountEndAt: dto.discountEndAt ? new Date(dto.discountEndAt) : null,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        isActive: dto.isActive ?? true,
        usageLimit: dto.usageLimit ?? null,
        usedCount: 0,
        usageLimitPerUser: dto.usageLimitPerUser ?? null,
        maxDiscountAmountPerUser: dto.maxDiscountAmountPerUser ?? null,
      }),
    );
    return toPromotionResponse(saved);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const promo = await this.requireById(id);

    if (dto.discountType !== undefined || dto.discountValue !== undefined) {
      this.assertDiscountValue(
        dto.discountType ?? promo.discountType,
        dto.discountValue !== undefined
          ? dto.discountValue
          : Number(promo.discountValue),
      );
    }

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);
      if (code && code !== promo.code) await this.ensureCodeUnique(code, id);
      promo.code = code;
    }

    if (dto.name !== undefined) promo.name = dto.name.trim();
    if (dto.description !== undefined) {
      promo.description = dto.description?.trim() || null;
    }
    if (dto.discountType !== undefined) promo.discountType = dto.discountType;
    if (dto.discountValue !== undefined) {
      promo.discountValue = dto.discountValue;
    }
    if (dto.discountPrice !== undefined) {
      promo.discountPrice = dto.discountPrice;
    }
    if (dto.discountStartAt !== undefined) {
      promo.discountStartAt = dto.discountStartAt
        ? new Date(dto.discountStartAt)
        : null;
    }
    if (dto.discountEndAt !== undefined) {
      promo.discountEndAt = dto.discountEndAt
        ? new Date(dto.discountEndAt)
        : null;
    }
    if (dto.minOrderAmount !== undefined) {
      promo.minOrderAmount = dto.minOrderAmount;
    }
    if (dto.maxDiscountAmount !== undefined) {
      promo.maxDiscountAmount = dto.maxDiscountAmount;
    }
    if (dto.isActive !== undefined) promo.isActive = dto.isActive;
    if (dto.usageLimit !== undefined) promo.usageLimit = dto.usageLimit;
    if (dto.usageLimitPerUser !== undefined) {
      promo.usageLimitPerUser = dto.usageLimitPerUser;
    }
    if (dto.maxDiscountAmountPerUser !== undefined) {
      promo.maxDiscountAmountPerUser = dto.maxDiscountAmountPerUser;
    }

    return toPromotionResponse(await this.promotions.save(promo));
  }

  async remove(id: string) {
    const promo = await this.requireById(id);
    await this.promotions.remove(promo);
    return { id };
  }

  /** پیش‌نمایش تخفیف برای کاربر (بدون ثبت usage) */
  async preview(
    userId: string,
    dto: PreviewPromotionDto,
  ): Promise<PromotionPreviewResponseDto> {
    const applied = await this.resolveForUser(
      userId,
      dto.code,
      dto.orderAmount,
    );
    const promo = await this.requireById(applied.promotionId);
    return {
      promotionId: applied.promotionId,
      code: applied.code,
      orderAmount: applied.orderAmount,
      discountAmount: applied.discountAmount,
      discountPrice: applied.discountPrice,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
    };
  }

  /**
   * اعمال پروموشن روی سفارش داخل تراکنش:
   * ثبت usage + افزایش usedCount
   */
  async applyToOrderInTransaction(
    manager: EntityManager,
    data: {
      userId: string;
      orderId: string;
      code: string;
      orderAmount: number;
    },
  ): Promise<AppliedPromotion> {
    const applied = await this.resolveForUser(
      data.userId,
      data.code,
      data.orderAmount,
      manager,
    );

    const promoRepo = manager.getRepository(Promotion);
    const usageRepo = manager.getRepository(PromotionUsage);

    const locked = await promoRepo.findOne({
      where: { id: applied.promotionId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!locked) {
      throw new ApiException(
        'PROMOTION_NOT_FOUND',
        'پروموشن یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    // دوباره چک سقف سراسری بعد از قفل
    if (
      locked.usageLimit != null &&
      locked.usedCount >= locked.usageLimit
    ) {
      throw new ApiException(
        'PROMOTION_USAGE_LIMIT',
        'سقف تعداد استفاده از این پروموشن پر شده است',
        HttpStatus.CONFLICT,
      );
    }

    await usageRepo.save(
      usageRepo.create({
        promotionId: locked.id,
        userId: data.userId,
        orderId: data.orderId,
        discountAmount: applied.discountAmount,
      }),
    );

    locked.usedCount += 1;
    await promoRepo.save(locked);

    return applied;
  }

  async resolveForUser(
    userId: string,
    code: string,
    orderAmount: number,
    manager?: EntityManager,
  ): Promise<AppliedPromotion> {
    const normalized = this.normalizeCode(code);
    if (!normalized) {
      throw new ApiException(
        'PROMOTION_CODE_REQUIRED',
        'کد پروموشن الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const promoRepo = manager
      ? manager.getRepository(Promotion)
      : this.promotions.getRepo();

    const promo = await promoRepo.findOne({
      where: { code: normalized },
    });
    if (!promo) {
      throw new ApiException(
        'PROMOTION_NOT_FOUND',
        'کد تخفیف نامعتبر است',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertApplicable(promo, orderAmount);

    const usageRepo = manager
      ? manager.getRepository(PromotionUsage)
      : this.promotions.getUsageRepo();

    if (promo.usageLimitPerUser != null) {
      const userCount = await usageRepo.count({
        where: { promotionId: promo.id, userId },
      });
      if (userCount >= promo.usageLimitPerUser) {
        throw new ApiException(
          'PROMOTION_USER_USAGE_LIMIT',
          'تعداد مجاز استفاده شما از این پروموشن تمام شده است',
          HttpStatus.CONFLICT,
        );
      }
    }

    const userDiscountSumRaw = await usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.discountAmount), 0)', 'total')
      .where('u.promotionId = :promotionId', { promotionId: promo.id })
      .andWhere('u.userId = :userId', { userId })
      .getRawOne<{ total: string }>();
    const userDiscountSum = Number(userDiscountSumRaw?.total ?? 0);

    let discountAmount = this.calculateDiscount(promo, orderAmount);

    if (promo.maxDiscountAmountPerUser != null) {
      const remaining =
        Number(promo.maxDiscountAmountPerUser) - userDiscountSum;
      if (remaining <= 0) {
        throw new ApiException(
          'PROMOTION_USER_AMOUNT_LIMIT',
          'سقف مبلغ تخفیف شما برای این پروموشن پر شده است',
          HttpStatus.CONFLICT,
        );
      }
      discountAmount = Math.min(discountAmount, remaining);
    }

    discountAmount = Math.min(discountAmount, orderAmount);
    discountAmount = Math.round(discountAmount * 10000) / 10000;

    if (discountAmount <= 0) {
      throw new ApiException(
        'PROMOTION_NO_DISCOUNT',
        'این پروموشن برای این مبلغ تخفیفی ندارد',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      promotionId: promo.id,
      code: promo.code,
      orderAmount,
      discountAmount,
      discountPrice: Math.max(0, orderAmount - discountAmount),
    };
  }

  calculateDiscount(promo: Promotion, orderAmount: number): number {
    if (promo.discountPrice != null) {
      const fixedFinal = Number(promo.discountPrice);
      return Math.max(0, orderAmount - fixedFinal);
    }

    let raw = 0;
    if (promo.discountType === 'PERCENTAGE') {
      raw = (orderAmount * Number(promo.discountValue)) / 100;
    } else {
      raw = Number(promo.discountValue);
    }

    if (promo.maxDiscountAmount != null) {
      raw = Math.min(raw, Number(promo.maxDiscountAmount));
    }

    return Math.max(0, raw);
  }

  private assertApplicable(promo: Promotion, orderAmount: number) {
    if (!promo.isActive) {
      throw new ApiException(
        'PROMOTION_INACTIVE',
        'این پروموشن غیرفعال است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    if (promo.discountStartAt && now < new Date(promo.discountStartAt)) {
      throw new ApiException(
        'PROMOTION_NOT_STARTED',
        'زمان شروع این پروموشن فرا نرسیده است',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (promo.discountEndAt && now > new Date(promo.discountEndAt)) {
      throw new ApiException(
        'PROMOTION_EXPIRED',
        'این پروموشن منقضی شده است',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      promo.minOrderAmount != null &&
      orderAmount < Number(promo.minOrderAmount)
    ) {
      throw new ApiException(
        'PROMOTION_MIN_ORDER',
        `حداقل مبلغ سفارش برای این تخفیف ${promo.minOrderAmount} است`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      promo.usageLimit != null &&
      promo.usedCount >= promo.usageLimit
    ) {
      throw new ApiException(
        'PROMOTION_USAGE_LIMIT',
        'سقف تعداد استفاده از این پروموشن پر شده است',
        HttpStatus.CONFLICT,
      );
    }
  }

  private assertDiscountValue(type: string, value: number) {
    if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
      throw new ApiException(
        'PROMOTION_INVALID_VALUE',
        'درصد تخفیف باید بین ۰ تا ۱۰۰ باشد',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private normalizeCode(code?: string | null): string | null {
    if (code == null || !String(code).trim()) return null;
    return String(code).trim().toUpperCase();
  }

  private async ensureCodeUnique(code: string, excludeId?: string) {
    const existing = await this.promotions.findByCode(code);
    if (existing && existing.id !== excludeId) {
      throw new ApiException(
        'PROMOTION_CODE_EXISTS',
        'این کد پروموشن قبلاً ثبت شده است',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async requireById(id: string) {
    const promo = await this.promotions.findById(id);
    if (!promo) {
      throw new ApiException(
        'PROMOTION_NOT_FOUND',
        'پروموشن یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return promo;
  }
}
