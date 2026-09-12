import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { userHasRole } from '../auth/types/auth-user.type.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Product } from '../products/entities/product.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { MediaAsset } from './entities/media-asset.entity.js';
import { mediaConfig } from './media.config.js';
import { MediaStorageService } from './media.storage.service.js';
import type {
  AttachMediaAssetDto,
  ListMediaAssetsDto,
  MediaAssetResponseDto,
  ReviewMediaAssetDto,
  UploadMediaDto,
} from './dto/media.dto.js';
import type { MediaGroup } from './entities/media-asset.enums.js';

export function canBrowseAllMedia(user: AuthUser): boolean {
  return userHasRole(
    user,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
  );
}

export function assertMediaAccess(user: AuthUser, sellerId: string) {
  if (canBrowseAllMedia(user)) {
    return;
  }
  if (
    !user.sellerId ||
    user.sellerId !== sellerId ||
    !userHasRole(user, DEFAULT_ROLE_SLUGS.SELLER)
  ) {
    throw new ApiException(
      'FORBIDDEN',
      'دسترسی به گالری این فروشنده ندارید',
      HttpStatus.FORBIDDEN,
    );
  }
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function startOfDayInTimeZone(timeZone: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  // Wall-clock in target TZ → reconstruct UTC instant of local midnight.
  const asUtcGuess = Date.UTC(get('year'), get('month') - 1, get('day'), 0, 0, 0);
  const noonUtc = new Date(
    Date.UTC(get('year'), get('month') - 1, get('day'), 12, 0, 0),
  );
  const tzNoon = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(noonUtc);
  const tzHour = Number(tzNoon.find((p) => p.type === 'hour')?.value ?? 12);
  const tzMinute = Number(tzNoon.find((p) => p.type === 'minute')?.value ?? 0);
  const offsetMinutes = (tzHour - 12) * 60 + tzMinute;
  return new Date(asUtcGuess - offsetMinutes * 60_000);
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(MediaAsset)
    private readonly media: Repository<MediaAsset>,
    @InjectRepository(Seller)
    private readonly sellers: Repository<Seller>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly storage: MediaStorageService,
  ) {}

  toResponse(asset: MediaAsset): MediaAssetResponseDto {
    return {
      id: asset.id,
      group: asset.group,
      sellerId: asset.sellerId,
      uploadedByUserId: asset.uploadedByUserId,
      productId: asset.productId,
      originalName: asset.originalName,
      alt: asset.alt,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      storageLocation: asset.storageLocation,
      status: asset.status,
      isUsed: asset.isUsed,
      expiresAt: asset.expiresAt,
      rejectionReason: asset.rejectionReason,
      url: this.storage.publicUrl(asset.storageLocation, asset.relativePath),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  private requireSellerId(user: AuthUser): string {
    if (!user.sellerId) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فروشنده در توکن احراز هویت مشخص نشده است',
        HttpStatus.FORBIDDEN,
      );
    }
    return user.sellerId;
  }

  async findAll(user: AuthUser, query: ListMediaAssetsDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.media.createQueryBuilder('media');

    if (canBrowseAllMedia(user)) {
      if (query.sellerId) {
        qb.andWhere('media.sellerId = :sellerId', {
          sellerId: query.sellerId,
        });
      }
    } else {
      const sellerId = this.requireSellerId(user);
      qb.andWhere('media.sellerId = :sellerId', { sellerId });
    }

    if (query.group) {
      qb.andWhere('media.group = :group', { group: query.group });
    }
    if (query.productId) {
      qb.andWhere('media.productId = :productId', {
        productId: query.productId,
      });
    }
    if (query.status) {
      qb.andWhere('media.status = :status', { status: query.status });
    }
    if (query.isUsed !== undefined) {
      qb.andWhere('media.isUsed = :isUsed', { isUsed: query.isUsed });
    }

    const [items, total] = await qb
      .orderBy('media.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return paginatedList(items.map((item) => this.toResponse(item)), page, limit, total);
  }

  async getEntity(id: string): Promise<MediaAsset> {
    const asset = await this.media.findOne({ where: { id } });
    if (!asset) {
      throw new ApiException(
        'MEDIA_NOT_FOUND',
        'رسانه یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return asset;
  }

  async findOne(user: AuthUser, id: string) {
    const asset = await this.getEntity(id);
    assertMediaAccess(user, asset.sellerId);
    return this.toResponse(asset);
  }

  async upload(
    user: AuthUser,
    file: Express.Multer.File | undefined,
    dto: UploadMediaDto,
  ) {
    const group: MediaGroup = dto.group;
    const sellerId = this.requireSellerId(user);
    assertMediaAccess(user, sellerId);

    if (!file?.buffer?.length) {
      throw new ApiException(
        'MEDIA_FILE_REQUIRED',
        'فایل الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (file.size > mediaConfig.maxFileBytes) {
      throw new ApiException(
        'MEDIA_FILE_TOO_LARGE',
        `حداکثر حجم فایل ${mediaConfig.maxFileBytes} بایت است`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const mime = (file.mimetype || '').toLowerCase();
    if (!mediaConfig.allowedMimeTypes.includes(mime)) {
      throw new ApiException(
        'MEDIA_MIME_NOT_ALLOWED',
        'نوع فایل مجاز نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!(await this.sellers.existsBy({ id: sellerId }))) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const dayStart = startOfDayInTimeZone(mediaConfig.cleanupTz);
    const dailyCount = await this.media
      .createQueryBuilder('media')
      .where('media.sellerId = :sellerId', { sellerId })
      .andWhere('media.createdAt >= :dayStart', { dayStart })
      .getCount();

    if (dailyCount >= mediaConfig.dailyUploadQuota) {
      throw new ApiException(
        'MEDIA_DAILY_QUOTA_EXCEEDED',
        `سهمیه آپلود روزانه (${mediaConfig.dailyUploadQuota}) تمام شده است`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const id = randomUUID();
    const relativePath = this.storage.buildRelativePath(
      group,
      sellerId,
      id,
      file.originalname || 'upload',
    );

    await this.storage.ensureDirs(group, sellerId);
    await this.storage.writeStaging(relativePath, file.buffer);

    const asset = this.media.create({
      id,
      group,
      sellerId,
      uploadedByUserId: user.sub,
      productId: null,
      originalName: (file.originalname || 'upload').slice(0, 255),
      alt: dto.alt?.trim() ? dto.alt.trim().slice(0, 500) : null,
      mimeType: mime,
      sizeBytes: file.size,
      relativePath,
      storageLocation: 'staging',
      status: 'pending',
      isUsed: false,
      expiresAt: hoursFromNow(mediaConfig.pendingTtlHours),
      rejectionReason: null,
    });

    await this.media.save(asset);
    return this.toResponse(asset);
  }

  async review(user: AuthUser, id: string, dto: ReviewMediaAssetDto) {
    if (!canBrowseAllMedia(user)) {
      throw new ApiException(
        'FORBIDDEN',
        'فقط ادمین / سوپرسلر می‌تواند رسانه را تأیید یا رد کند',
        HttpStatus.FORBIDDEN,
      );
    }

    const asset = await this.getEntity(id);

    if (asset.status === 'approved' && dto.status === 'approved') {
      return this.toResponse(asset);
    }

    if (asset.isUsed && dto.status === 'rejected') {
      throw new ApiException(
        'MEDIA_IN_USE',
        'رسانه متصل به محصول قابل رد نیست؛ ابتدا جدا کنید',
        HttpStatus.CONFLICT,
      );
    }

    if (dto.status === 'approved') {
      if (asset.storageLocation === 'staging') {
        await this.storage.promoteToGallery(asset.relativePath);
        asset.storageLocation = 'gallery';
      }
      asset.status = 'approved';
      asset.expiresAt = null;
      asset.rejectionReason = null;
    } else {
      asset.status = 'rejected';
      asset.isUsed = false;
      asset.productId = null;
      asset.expiresAt = hoursFromNow(mediaConfig.rejectedTtlHours);
      asset.rejectionReason = dto.rejectionReason ?? null;
    }

    await this.media.save(asset);
    return this.toResponse(asset);
  }

  async attach(user: AuthUser, id: string, dto: AttachMediaAssetDto) {
    const asset = await this.getEntity(id);
    assertMediaAccess(user, asset.sellerId);

    if (asset.status !== 'approved') {
      throw new ApiException(
        'MEDIA_NOT_APPROVED',
        'فقط رسانه تأییدشده قابل اتصال به محصول است',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!(await this.products.existsBy({ id: dto.productId }))) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    asset.productId = dto.productId;
    asset.isUsed = true;
    asset.expiresAt = null;
    await this.media.save(asset);
    return this.toResponse(asset);
  }

  async detach(user: AuthUser, id: string) {
    const asset = await this.getEntity(id);
    assertMediaAccess(user, asset.sellerId);

    asset.productId = null;
    asset.isUsed = false;
    if (asset.status === 'approved') {
      asset.expiresAt = null;
    }
    await this.media.save(asset);
    return this.toResponse(asset);
  }

  async remove(user: AuthUser, id: string) {
    const asset = await this.getEntity(id);
    assertMediaAccess(user, asset.sellerId);

    if (asset.isUsed) {
      throw new ApiException(
        'MEDIA_IN_USE',
        'رسانه متصل به محصول قابل حذف نیست؛ ابتدا جدا کنید',
        HttpStatus.CONFLICT,
      );
    }

    await this.storage.deleteFile(asset.storageLocation, asset.relativePath);
    await this.media.delete(asset.id);
    return { id };
  }

  async cleanupExpired(): Promise<{ deleted: number }> {
    const now = new Date();
    const expired = await this.media.find({
      where: [
        {
          status: 'pending',
          isUsed: false,
          expiresAt: LessThan(now),
        },
        {
          status: 'rejected',
          isUsed: false,
          expiresAt: LessThan(now),
        },
      ],
    });

    // Also catch rows where expiresAt is somehow null but unused pending/rejected
    // — skip; user rule requires expires_at < NOW().

    let deleted = 0;
    for (const asset of expired) {
      if (asset.expiresAt == null) {
        continue;
      }
      await this.storage.deleteFile(asset.storageLocation, asset.relativePath);
      await this.media.delete(asset.id);
      deleted += 1;
    }

    this.logger.log(`Media cleanup removed ${deleted} expired unused assets`);
    return { deleted };
  }
}
