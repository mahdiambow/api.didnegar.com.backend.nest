import { newId } from '../common/id/index.js';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { userHasRole } from '../utils/auth/types/auth-user.type.js';
import { toUserResponse } from '../utils/auth/dto/user-response.dto.js';
import { UserRepository } from '../utils/auth/repositories/user.repository.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Product } from '../products/entities/product.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { SellerRepository } from '../sellers/repositories/seller.repository.js';
import { toSellerResponse } from '../sellers/dto/seller-response.dto.js';
import { MediaAsset } from './entities/media-asset.entity.js';
import { mediaConfig } from './media.config.js';
import { MediaStorageService } from './media.storage.service.js';
import { MediaSeaweedService } from './media-seaweed.service.js';
import type {
  AttachMediaAssetDto,
  ListMediaAssetsDto,
  MediaAssetResponseDto,
  DirectUploadUrlResponseDto,
  RequestMediaUploadUrlDto,
} from './dto/media.dto.js';
import type { MediaScope } from './entities/media-asset.enums.js';

export function canBrowseAllMedia(user: AuthUser): boolean {
  return userHasRole(
    user,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
  );
}

function isSuperSeller(user: AuthUser): boolean {
  return userHasRole(user, DEFAULT_ROLE_SLUGS.SUPER_SELLER);
}

export function assertMediaAccess(user: AuthUser, sellerId: string | null) {
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

function isAdministrator(user: AuthUser): boolean {
  return userHasRole(
    user,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  );
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
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
    private readonly sellerRepository: SellerRepository,
    private readonly userRepository: UserRepository,
    private readonly storage: MediaStorageService,
    private readonly seaweed: MediaSeaweedService,
  ) {}

  toResponse(
    asset: MediaAsset,
    populated: {
      seller?: MediaAssetResponseDto['seller'];
      uploadedByUser?: MediaAssetResponseDto['uploadedByUser'];
    } = {},
  ): MediaAssetResponseDto {
    return {
      id: asset.id,
      group: asset.group,
      scope: asset.scope,
      sellerId: asset.sellerId,
      uploadedByUserId: asset.uploadedByUserId,
      seller: populated.seller ?? null,
      uploadedByUser: populated.uploadedByUser ?? null,
      productId: asset.productId,
      originalName: asset.originalName,
      alt: asset.alt,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      storageLocation: asset.storageLocation,
      isUsed: asset.isUsed,
      expiresAt: asset.expiresAt,
      url:
        asset.scope === 'product' ||
        asset.scope === 'banner' ||
        asset.scope === 'gallery'
          ? this.seaweed.publicUrl(asset.relativePath)
          : this.storage.publicUrl(asset.storageLocation, asset.relativePath),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  private async toEnrichedResponses(
    assets: MediaAsset[],
    mode: 'list' | 'detail' = 'detail',
  ): Promise<MediaAssetResponseDto[]> {
    if (mode === 'list') {
      return assets.map((asset) =>
        this.toResponse(asset, { seller: null, uploadedByUser: null }),
      );
    }

    const sellerIds = [
      ...new Set(assets.map((asset) => asset.sellerId).filter(Boolean)),
    ] as string[];
    const userIds = [
      ...new Set(assets.map((asset) => asset.uploadedByUserId).filter(Boolean)),
    ];

    const [sellers, users] = await Promise.all([
      this.sellerRepository.findByIds(sellerIds),
      this.userRepository.findByIds(userIds),
    ]);

    const sellerMap = new Map(
      sellers.map((seller) => [seller.id, toSellerResponse(seller)]),
    );
    const userMap = new Map(
      users.map((user) => [user.id, toUserResponse(user)]),
    );

    return assets.map((asset) =>
      this.toResponse(asset, {
        seller: asset.sellerId ? (sellerMap.get(asset.sellerId) ?? null) : null,
        uploadedByUser: userMap.get(asset.uploadedByUserId) ?? null,
      }),
    );
  }

  private async toEnrichedResponse(asset: MediaAsset) {
    const [response] = await this.toEnrichedResponses([asset]);
    return response;
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

  private assertAllowedMimeAndSize(mimeType: string, sizeBytes: number) {
    const mime = mimeType.toLowerCase().trim();
    if (!mediaConfig.allowedMimeTypes.includes(mime)) {
      throw new ApiException(
        'MEDIA_MIME_NOT_ALLOWED',
        'نوع فایل مجاز نیست',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !Number.isInteger(sizeBytes) ||
      sizeBytes < 1 ||
      sizeBytes > mediaConfig.maxFileBytes
    ) {
      throw new ApiException(
        'MEDIA_FILE_TOO_LARGE',
        `حجم فایل باید بین 1 و ${mediaConfig.maxFileBytes} بایت باشد`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return mime;
  }

  private async getProductForUpload(productId: string): Promise<Product> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return product;
  }

  /** Elevated media users manage every product; sellers manage their own. */
  private assertProductUploadAccess(user: AuthUser, product: Product) {
    if (canBrowseAllMedia(user)) return;
    if (
      !user.sellerId ||
      !userHasRole(user, DEFAULT_ROLE_SLUGS.SELLER) ||
      product.createdBySellerId !== user.sellerId
    ) {
      throw new ApiException(
        'FORBIDDEN',
        'فقط فروشنده سازنده محصول یا ادمین می‌تواند تصاویر این محصول را مدیریت کند',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private buildSeaweedKey(
    scope: Extract<MediaScope, 'product' | 'banner'>,
    assetId: string,
    filename: string,
    sellerId: string | null,
  ): string {
    const extension =
      filename.match(/\.[a-z0-9]{1,10}$/i)?.[0]?.toLowerCase() ?? '';
    if (scope === 'banner') return `banners/${assetId}${extension}`;
    const owner = sellerId ?? 'admin';
    return `products/${owner}/gallery/${assetId}${extension}`;
  }

  private async addSeaweedProductImage(asset: MediaAsset): Promise<void> {
    if (
      asset.scope === 'legacy' ||
      asset.scope === 'banner' ||
      !asset.productId
    )
      return;
    const product = await this.getProductForUpload(asset.productId);
    const url = this.seaweed.publicUrl(asset.relativePath);
    const image = product.image ?? { featuredImg: null, gallery: [] };
    if (!image.featuredImg) image.featuredImg = url;
    else if (!image.gallery.includes(url)) image.gallery.push(url);
    product.image = image;
    await this.products.save(product);
  }

  /** Keep the denormalized Product.image JSON free of stale Seaweed URLs. */
  private async removeSeaweedProductImage(asset: MediaAsset): Promise<void> {
    if (
      asset.scope === 'legacy' ||
      asset.scope === 'banner' ||
      !asset.productId
    )
      return;
    const product = await this.products.findOne({
      where: { id: asset.productId },
    });
    if (!product) return;

    const url = this.seaweed.publicUrl(asset.relativePath);
    const image = product.image ?? { featuredImg: null, gallery: [] };
    const gallery = (image.gallery ?? []).filter((item) => item !== url);
    const featuredImg =
      image.featuredImg === url ? (gallery.shift() ?? null) : image.featuredImg;
    if (
      featuredImg === image.featuredImg &&
      gallery.length === (image.gallery ?? []).length
    ) {
      return;
    }
    product.image = { featuredImg, gallery };
    await this.products.save(product);
  }

  private async assertDirectAssetManageAccess(
    user: AuthUser,
    asset: MediaAsset,
  ) {
    if (asset.scope === 'banner') {
      if (!isAdministrator(user)) {
        throw new ApiException(
          'FORBIDDEN',
          'فقط ادمین می‌تواند بنر سایت را مدیریت کند',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    if (asset.scope === 'product' && asset.productId) {
      const product = await this.getProductForUpload(asset.productId);
      this.assertProductUploadAccess(user, product);
      return;
    }
    assertMediaAccess(user, asset.sellerId);
  }

  async requestUploadUrl(
    user: AuthUser,
    dto: RequestMediaUploadUrlDto,
  ): Promise<DirectUploadUrlResponseDto> {
    const mimeType = this.assertAllowedMimeAndSize(dto.mimeType, dto.sizeBytes);
    const scope = dto.scope;
    let sellerId: string | null = null;

    if (scope === 'banner') {
      if (!isAdministrator(user)) {
        throw new ApiException(
          'FORBIDDEN',
          'فقط ادمین می‌تواند بنر سایت آپلود کند',
          HttpStatus.FORBIDDEN,
        );
      }
    } else if (canBrowseAllMedia(user)) {
      // Elevated media users upload unassigned product media. Administrators
      // can later attach it to any product they manage.
      sellerId = null;
    } else {
      sellerId = this.requireSellerId(user);
      assertMediaAccess(user, sellerId);
      if (!(await this.sellers.existsBy({ id: sellerId }))) {
        throw new ApiException(
          'SELLER_NOT_FOUND',
          'فروشنده یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const id = newId();
    const objectKey = this.buildSeaweedKey(scope, id, dto.filename, sellerId);
    const asset = this.media.create({
      id,
      group: scope === 'banner' ? 'banner' : 'product',
      scope,
      sellerId,
      uploadedByUserId: user.sub,
      productId: null,
      originalName: dto.filename.trim().slice(0, 255),
      alt: dto.alt?.trim().slice(0, 500) || null,
      mimeType,
      sizeBytes: dto.sizeBytes,
      relativePath: objectKey,
      storageLocation: 'gallery',
      isUsed: false,
      expiresAt: hoursFromNow(mediaConfig.pendingTtlHours),
    });
    await this.media.save(asset);

    try {
      const uploadUrl = await this.seaweed.createUploadUrl(objectKey, mimeType);
      return {
        mediaId: id,
        objectKey,
        uploadUrl,
        expiresIn: mediaConfig.seaweed.uploadUrlTtlSeconds,
      };
    } catch (error) {
      await this.media.delete(id);
      const message = error instanceof Error ? error.message : String(error);
      throw new ApiException(
        'MEDIA_STORAGE_FAILED',
        message,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async completeDirectUpload(user: AuthUser, id: string) {
    const asset = await this.getEntity(id);
    if (asset.scope === 'banner') {
      if (!isAdministrator(user)) {
        throw new ApiException(
          'FORBIDDEN',
          'فقط ادمین می‌تواند بنر سایت را تأیید کند',
          HttpStatus.FORBIDDEN,
        );
      }
    } else if (asset.scope === 'product' || asset.scope === 'gallery') {
      if (asset.scope === 'product' && asset.productId) {
        const product = await this.getProductForUpload(asset.productId);
        this.assertProductUploadAccess(user, product);
      } else {
        assertMediaAccess(user, asset.sellerId);
      }
    } else {
      throw new ApiException(
        'MEDIA_SCOPE_INVALID',
        'این رسانه از آپلود مستقیم SeaweedFS نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.seaweed.assertObject(asset.relativePath, asset.sizeBytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ApiException(
        'MEDIA_UPLOAD_INCOMPLETE',
        message,
        HttpStatus.BAD_REQUEST,
      );
    }

    asset.expiresAt = null;
    asset.isUsed = Boolean(asset.productId);
    await this.media.save(asset);

    await this.addSeaweedProductImage(asset);
    return this.toEnrichedResponse(asset);
  }

  async findAll(user: AuthUser, query: ListMediaAssetsDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.media.createQueryBuilder('media');

    if (canBrowseAllMedia(user)) {
      // A super-seller's gallery is always system-wide. Do not let a stale
      // sellerId query left by the client hide the rest of the media library.
      if (query.sellerId && !isSuperSeller(user)) {
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
    if (query.isUsed !== undefined) {
      qb.andWhere('media.isUsed = :isUsed', { isUsed: query.isUsed });
    }

    const [items, total] = await qb
      .orderBy('media.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return paginatedList(
      await this.toEnrichedResponses(items, 'list'),
      page,
      limit,
      total,
    );
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
    return this.toEnrichedResponse(asset);
  }

  async attach(user: AuthUser, id: string, dto: AttachMediaAssetDto) {
    const asset = await this.getEntity(id);
    await this.assertDirectAssetManageAccess(user, asset);

    if (asset.scope === 'banner') {
      throw new ApiException(
        'MEDIA_SCOPE_INVALID',
        'بنر سایت قابل اتصال به محصول نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (asset.expiresAt !== null) {
      throw new ApiException(
        'MEDIA_UPLOAD_INCOMPLETE',
        'فقط رسانه‌ای که آپلود آن تکمیل شده قابل اتصال به محصول است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const product = await this.getProductForUpload(dto.productId);
    this.assertProductUploadAccess(user, product);

    await this.removeSeaweedProductImage(asset);
    asset.productId = dto.productId;
    asset.isUsed = true;
    asset.expiresAt = null;
    await this.media.save(asset);
    await this.addSeaweedProductImage(asset);
    return this.toEnrichedResponse(asset);
  }

  async detach(user: AuthUser, id: string) {
    const asset = await this.getEntity(id);
    await this.assertDirectAssetManageAccess(user, asset);

    await this.removeSeaweedProductImage(asset);

    asset.productId = null;
    asset.isUsed = false;
    await this.media.save(asset);
    return this.toEnrichedResponse(asset);
  }

  async remove(user: AuthUser, id: string) {
    const asset = await this.getEntity(id);
    await this.assertDirectAssetManageAccess(user, asset);

    if (asset.isUsed) {
      throw new ApiException(
        'MEDIA_IN_USE',
        'رسانه متصل به محصول قابل حذف نیست؛ ابتدا جدا کنید',
        HttpStatus.CONFLICT,
      );
    }

    await this.removeSeaweedProductImage(asset);

    if (
      asset.scope === 'product' ||
      asset.scope === 'banner' ||
      asset.scope === 'gallery'
    ) {
      await this.seaweed.deleteObject(asset.relativePath);
    } else {
      await this.storage.deleteFile(asset.storageLocation, asset.relativePath);
    }
    await this.media.delete(asset.id);
    return { id };
  }

  async cleanupExpired(): Promise<{ deleted: number }> {
    const now = new Date();
    const expired = await this.media.find({
      where: { isUsed: false, expiresAt: LessThan(now) },
    });

    // Assets with no expiry have completed upload and remain in the gallery.

    let deleted = 0;
    for (const asset of expired) {
      if (asset.expiresAt == null) {
        continue;
      }
      if (
        asset.scope === 'product' ||
        asset.scope === 'banner' ||
        asset.scope === 'gallery'
      ) {
        await this.seaweed.deleteObject(asset.relativePath);
      } else {
        await this.storage.deleteFile(
          asset.storageLocation,
          asset.relativePath,
        );
      }
      await this.media.delete(asset.id);
      deleted += 1;
    }

    this.logger.log(`Media cleanup removed ${deleted} expired unused assets`);
    return { deleted };
  }
}
