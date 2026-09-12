import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { userHasRole } from '../auth/types/auth-user.type.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ProductStock } from '../products/entities/product-stock.entity.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { BrandRepository } from '../brands/repositories/brand.repository.js';
import { CategoriesService } from '../categories/categories.service.js';
import { toProductEntityData } from '../products/dto/product-fields.dto.js';
import { SellerOffer } from '../offers/entities/seller-offer.entity.js';
import { OfferProduct } from './entities/offer-product.entity.js';
import { CreateOfferProductDto } from './dto/create-offer-product.dto.js';
import { ListOfferProductsQueryDto } from './dto/list-offer-products-query.dto.js';
import { ReviewOfferProductDto } from './dto/review-offer-product.dto.js';
import { toOfferProductResponse } from './dto/offer-product-response.dto.js';

function assertOfferProductAccess(user: AuthUser, sellerId: string) {
  if (
    userHasRole(
      user,
      DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
      DEFAULT_ROLE_SLUGS.ADMIN,
      DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    )
  ) {
    return;
  }
  if (
    !user.sellerId ||
    user.sellerId !== sellerId ||
    !userHasRole(user, DEFAULT_ROLE_SLUGS.SELLER)
  ) {
    throw new ApiException(
      'FORBIDDEN',
      'دسترسی به این درخواست محصول ندارید',
      HttpStatus.FORBIDDEN,
    );
  }
}

@Injectable()
export class OfferProductsService {
  constructor(
    @InjectRepository(OfferProduct)
    private readonly offerProducts: Repository<OfferProduct>,
    @InjectRepository(Seller)
    private readonly sellers: Repository<Seller>,
    @InjectRepository(SellerOffer)
    private readonly offers: Repository<SellerOffer>,
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly categoriesService: CategoriesService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: ListOfferProductsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.offerProducts.createQueryBuilder('item');

    if (query.sellerId) {
      qb.andWhere('item.sellerId = :sellerId', { sellerId: query.sellerId });
    }
    if (query.approvalStatus) {
      qb.andWhere('item.approvalStatus = :approvalStatus', {
        approvalStatus: query.approvalStatus,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('item.isActive = :isActive', { isActive: query.isActive });
    }

    const [items, total] = await qb
      .orderBy('item.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return paginatedList(
      items.map(toOfferProductResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    return toOfferProductResponse(await this.getEntity(id));
  }

  async create(user: AuthUser, dto: CreateOfferProductDto) {
    assertOfferProductAccess(user, dto.sellerId);

    if (!(await this.sellers.existsBy({ id: dto.sellerId }))) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.assertUniqueSlug(dto.slug);
    if (dto.brandId) {
      await this.assertBrandExists(dto.brandId);
    }

    const skuExists = await this.offers.existsBy({
      sellerId: dto.sellerId,
      sku: dto.sku,
    });
    if (skuExists) {
      throw new ApiException(
        'OFFER_EXISTS',
        'SKU برای این فروشنده تکراری است',
        HttpStatus.CONFLICT,
      );
    }

    const saved = await this.offerProducts.save(
      this.offerProducts.create({
        sellerId: dto.sellerId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        shortDescription: dto.shortDescription ?? null,
        brandId: dto.brandId ?? null,
        categoryIds: dto.categoryIds ?? [],
        attributes: dto.attributes ?? {},
        isVirtual: dto.isVirtual ?? false,
        isDownloadable: dto.isDownloadable ?? false,
        isActive: dto.isActive ?? true,
        taxStatus: dto.taxStatus ?? null,
        taxClass: dto.taxClass ?? null,
        weight: dto.weight ?? null,
        length: dto.length ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        sku: dto.sku,
        price: dto.price,
        stock: dto.stock,
        stockStatus: dto.stockStatus,
        isOnSale: dto.isOnSale ?? false,
        approvalStatus: 'pending',
        rejectionReason: null,
        productId: null,
        offerId: null,
      }),
    );

    return toOfferProductResponse(saved);
  }

  async review(id: string, dto: ReviewOfferProductDto) {
    const item = await this.getEntity(id);

    if (item.approvalStatus === 'approved' && item.productId) {
      throw new ApiException(
        'OFFER_PRODUCT_ALREADY_APPROVED',
        'این درخواست قبلاً تأیید و به محصول تبدیل شده است',
        HttpStatus.CONFLICT,
      );
    }

    if (dto.approvalStatus === 'rejected') {
      const reason = dto.rejectionReason?.trim();
      if (!reason) {
        throw new ApiException(
          'REJECTION_REASON_REQUIRED',
          'برای رد درخواست باید دلیل وارد شود',
          HttpStatus.BAD_REQUEST,
        );
      }
      item.approvalStatus = 'rejected';
      item.rejectionReason = reason;
      return toOfferProductResponse(await this.offerProducts.save(item));
    }

    if (dto.approvalStatus === 'pending') {
      item.approvalStatus = 'pending';
      item.rejectionReason = null;
      return toOfferProductResponse(await this.offerProducts.save(item));
    }

    return this.approveAndMaterialize(item);
  }

  private async approveAndMaterialize(item: OfferProduct) {
    await this.assertUniqueSlug(item.slug, item.id);
    if (item.brandId) {
      await this.assertBrandExists(item.brandId);
    }

    return this.dataSource.transaction(async (manager) => {
      const legacyId = await this.productRepository.getNextLegacyId();
      const productRepo = manager.getRepository(Product);
      const offerRepo = manager.getRepository(SellerOffer);
      const offerProductRepo = manager.getRepository(OfferProduct);

      const product = await productRepo.save(
        productRepo.create(
          toProductEntityData(
            {
              name: item.name,
              slug: item.slug,
              sku: item.sku,
              description: item.description ?? undefined,
              shortDescription: item.shortDescription ?? undefined,
              status: 'publish',
              brandId: item.brandId,
              isVirtual: item.isVirtual,
              isDownloadable: item.isDownloadable,
              isActive: item.isActive,
              taxStatus: item.taxStatus ?? undefined,
              taxClass: item.taxClass ?? undefined,
              weight: item.weight !== null ? Number(item.weight) : undefined,
              length: item.length !== null ? Number(item.length) : undefined,
              width: item.width !== null ? Number(item.width) : undefined,
              height: item.height !== null ? Number(item.height) : undefined,
              attributeIds: [],
              sellerIds: [item.sellerId],
              approvalStatus: 'approved',
              rejectionReason: null,
            },
            legacyId,
          ),
        ),
      );

      const stockRepo = manager.getRepository(ProductStock);
      await stockRepo.save(
        stockRepo.create({
          productId: product.id,
          stock: item.stock,
        }),
      );

      const offer = await offerRepo.save(
        offerRepo.create({
          sellerId: item.sellerId,
          productId: product.id,
          attributes: {},
          sku: item.sku,
          price: item.price,
          stock: item.stock,
          stockStatus: item.stockStatus,
          isOnSale: item.isOnSale,
          taxStatus: item.taxStatus,
          taxClass: item.taxClass,
          isActive: item.isActive,
          approvalStatus: 'approved',
          rejectionReason: null,
        }),
      );

      item.approvalStatus = 'approved';
      item.rejectionReason = null;
      item.productId = product.id;
      item.offerId = offer.id;

      return {
        saved: await offerProductRepo.save(item),
        productId: product.id,
        categoryIds: item.categoryIds ?? [],
      };
    }).then(async ({ saved, productId, categoryIds }) => {
      await this.categoriesService.assignCategoryIdsToProduct(
        productId,
        categoryIds,
      );
      return toOfferProductResponse(saved);
    });
  }

  async remove(user: AuthUser, id: string) {
    const item = await this.getEntity(id);
    assertOfferProductAccess(user, item.sellerId);

    if (item.approvalStatus === 'approved' && item.productId) {
      throw new ApiException(
        'OFFER_PRODUCT_APPROVED',
        'درخواست تأیید‌شده قابل حذف نیست',
        HttpStatus.CONFLICT,
      );
    }

    await this.offerProducts.delete(id);
    return {};
  }

  private async getEntity(id: string) {
    const item = await this.offerProducts.findOne({ where: { id } });
    if (!item) {
      throw new ApiException(
        'OFFER_PRODUCT_NOT_FOUND',
        'درخواست محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return item;
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const existingRequest = await this.offerProducts.findOne({
      where: { slug },
    });
    if (existingRequest && existingRequest.id !== excludeId) {
      throw new ApiException(
        'OFFER_PRODUCT_SLUG_EXISTS',
        'اسلاگ درخواست تکراری است',
        HttpStatus.CONFLICT,
      );
    }

    const existingProduct = await this.productRepository.findBySlug(slug);
    if (existingProduct) {
      throw new ApiException(
        'PRODUCT_SLUG_EXISTS',
        'اسلاگ محصول تکراری است',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async assertBrandExists(brandId: string) {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new ApiException(
        'BRAND_NOT_FOUND',
        'برند یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
