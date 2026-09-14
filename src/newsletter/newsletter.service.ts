import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { UserRepository } from '../auth/repositories/user.repository.js';
import { NewsletterSubscription } from './entities/newsletter-subscription.entity.js';
import {
  ListNewsletterQueryDto,
  NewsletterSubscriptionResponseDto,
} from './dto/newsletter.dto.js';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscription)
    private readonly subscriptions: Repository<NewsletterSubscription>,
    private readonly userRepository: UserRepository,
  ) {}

  /** عضویت — userId از JWT، ایمیل از دیتابیس کاربر */
  async subscribe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const email = user.email?.trim();
    if (!email) {
      throw new ApiException(
        'USER_EMAIL_REQUIRED',
        'برای عضویت در خبرنامه باید ایمیل در پروفایل کاربر ثبت شده باشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.subscriptions.findOneBy({ userId });
    if (existing) {
      existing.email = email;
      existing.isActive = true;
      return this.toResponse(await this.subscriptions.save(existing));
    }

    const saved = await this.subscriptions.save(
      this.subscriptions.create({
        userId,
        email,
        isActive: true,
      }),
    );
    return this.toResponse(saved);
  }

  /** لغو عضویت — userId از JWT */
  async unsubscribe(userId: string) {
    const existing = await this.subscriptions.findOneBy({ userId });
    if (!existing) {
      throw new ApiException(
        'NEWSLETTER_NOT_FOUND',
        'عضویت خبرنامه برای این کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    existing.isActive = false;
    return this.toResponse(await this.subscriptions.save(existing));
  }

  /** وضعیت عضویت کاربر لاگین‌شده */
  async mySubscription(userId: string) {
    const existing = await this.subscriptions.findOneBy({ userId });
    if (!existing) {
      return null;
    }
    return this.toResponse(existing);
  }

  async findAll(query: ListNewsletterQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.subscriptions.createQueryBuilder('sub');

    if (query.isActive !== undefined) {
      qb.andWhere('sub.isActive = :isActive', { isActive: query.isActive });
    }

    const [items, total] = await qb
      .orderBy('sub.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return paginatedList(items.map((item) => this.toResponse(item)), page, limit, total);
  }

  private toResponse(
    sub: NewsletterSubscription,
  ): NewsletterSubscriptionResponseDto {
    return {
      id: sub.id,
      userId: sub.userId,
      email: sub.email,
      isActive: sub.isActive,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }
}
