import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { userHasRole } from '../utils/auth/types/auth-user.type.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ProductsService } from '../products/products.service.js';
import { ProductStockRepository } from '../products/repositories/product-stock.repository.js';
import { SellerOffer } from './entities/seller-offer.entity.js';

import {
  CreateSellerOffersDto,
  ListMySellerOffersDto,
  ListSellerOffersDto,
  OFFER_IMMEDIATE_FIELDS,
  ReviewSellerOfferDto,
  SellerOfferItemDto,
  SellerOfferListItemDto,
  UpdateSellerOfferDto,
} from './dto/seller-offer.dto.js';
import type {
  ProductListItemDto,
  ProductResponseDto,
} from '../products/dto/product-response.dto.js';
import type { CreateProductDto } from '../products/dto/create-product.dto.js';

export function assertOfferAccess(user: AuthUser, sellerId: string) {
  if (
    userHasRole(
      user,
      DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
      DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    )
  )
    return;
  if (
    !user.sellerId ||
    user.sellerId !== sellerId ||
    !userHasRole(user, DEFAULT_ROLE_SLUGS.SELLER, DEFAULT_ROLE_SLUGS.ADMIN)
  )
    throw new ApiException(
      'FORBIDDEN',
      'دسترسی به پیشنهاد فروش این فروشنده ندارید',
      HttpStatus.FORBIDDEN,
    );
}

export function isImmediateOfferUpdate(dto: UpdateSellerOfferDto): boolean {
  const keys = Object.keys(dto).filter(
    (key) => (dto as Record<string, unknown>)[key] !== undefined,
  );
  return (
    keys.length > 0 && keys.every((key) => OFFER_IMMEDIATE_FIELDS.has(key))
  );
}

export const toOfferResponse = (
  offer: SellerOffer,
  product?: ProductResponseDto | ProductListItemDto,
) => ({
  offerId: offer.id,
  sellerId: offer.sellerId,
  productId: offer.productId,
  sku: offer.sku,
  price: Number(offer.price),
  stock: offer.stock,
  stockStatus: offer.stockStatus,
  isOnSale: offer.isOnSale,
  taxStatus: offer.taxStatus,
  taxClass: offer.taxClass,
  isActive: offer.isActive,
  approvalStatus: offer.approvalStatus ?? 'approved',
  rejectionReason: offer.rejectionReason ?? null,
  ...(product ? { product } : {}),
  createdAt: offer.createdAt,
  updatedAt: offer.updatedAt,
});

export const toOfferListResponse = (
  offer: SellerOffer,
  product?: ProductListItemDto,
): SellerOfferListItemDto => ({
  offerId: offer.id,
  sellerId: offer.sellerId,
  productId: offer.productId,
  sku: offer.sku,
  price: Number(offer.price),
  stock: offer.stock,
  stockStatus: offer.stockStatus,
  isOnSale: offer.isOnSale,
  isActive: offer.isActive,
  approvalStatus: offer.approvalStatus ?? 'approved',
  ...(product ? { product } : {}),
  createdAt: offer.createdAt,
});

@Injectable()
export class OffersService {
  /** کش COUNT لیست بدون فیلتر — از اجرای COUNT روی کل جدول در هر request جلوگیری می‌کند */
  private static readonly APPROVED_COUNT_TTL_MS = 30_000;
  private approvedCountCache: { value: number; expiresAt: number } | null =
    null;

  constructor(
    @InjectRepository(SellerOffer)
    private readonly offers: Repository<SellerOffer>,
    @InjectRepository(Seller) private readonly sellers: Repository<Seller>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => ProductStockRepository))
    private readonly productStockRepository: ProductStockRepository,
  ) {}

  async findAll(query: ListSellerOffersDto, viewer?: AuthUser | null) {
    const { page, limit, offset } = getPaginationParams(query);
    const includeTotal = query.includeTotal !== false;
    const needsCategoryFilter = Boolean(
      query.categoryId || query.subCategoryId,
    );
    const viewerSellerId = viewer?.sellerId ?? null;

    const itemsQb = this.applyListFilters(
      this.offers
        .createQueryBuilder('offer')
        .select([
          'offer.id',
          'offer.sellerId',
          'offer.productId',
          'offer.sku',
          'offer.price',
          'offer.stock',
          'offer.stockStatus',
          'offer.isOnSale',
          'offer.isActive',
          'offer.approvalStatus',
          'offer.createdAt',
        ]),
      query,
      needsCategoryFilter,
      viewerSellerId,
    )
      .orderBy('offer.price', 'ASC')
      .addOrderBy('offer.id', 'ASC')
      .skip(offset)
      .take(limit);

    const [items, total] = await Promise.all([
      itemsQb.getMany(),
      includeTotal
        ? this.resolveListTotal(query, needsCategoryFilter, viewerSellerId)
        : Promise.resolve(null),
    ]);

    // لیست: محصول سبک (بدون description / درخت دسته / همه attribute values)
    const products = await this.productsService.findByIds(
      items.map((offer) => offer.productId),
      'list',
    );
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const resolvedTotal =
      total ??
      // بدون COUNT: total تقریبی فقط برای hasNext/hasPrevious
      (items.length === limit
        ? offset + items.length + 1
        : offset + items.length);

    return paginatedList(
      items.map((offer) =>
        toOfferListResponse(offer, productById.get(offer.productId)),
      ),
      page,
      limit,
      resolvedTotal,
    );
  }

  /**
   * لیست آفرهای خود فروشنده — sellerId از JWT.
   * پیش‌فرض همه وضعیت‌ها؛ pending فروشنده‌های دیگر دیده نمی‌شود.
   */
  async findMine(user: AuthUser, query: ListMySellerOffersDto) {
    const sellerId = user.sellerId;
    if (!sellerId) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فروشنده در توکن احراز هویت مشخص نشده است',
        HttpStatus.FORBIDDEN,
      );
    }

    const { page, limit, offset } = getPaginationParams(query);
    const includeTotal = query.includeTotal !== false;
    const needsCategoryFilter = Boolean(
      query.categoryId || query.subCategoryId,
    );

    const qb = this.offers
      .createQueryBuilder('offer')
      .select([
        'offer.id',
        'offer.sellerId',
        'offer.productId',
        'offer.sku',
        'offer.price',
        'offer.stock',
        'offer.stockStatus',
        'offer.isOnSale',
        'offer.isActive',
        'offer.approvalStatus',
        'offer.createdAt',
      ])
      .where('offer.sellerId = :sellerId', { sellerId });

    if (query.approvalStatus) {
      qb.andWhere('offer.approvalStatus = :approvalStatus', {
        approvalStatus: query.approvalStatus,
      });
    }

    if (query.productId) {
      qb.andWhere('offer.productId = :productId', {
        productId: query.productId,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('offer.isActive = :isActive', { isActive: query.isActive });
    }

    if (needsCategoryFilter) {
      this.applyProductCategoryFilter(qb, query);
      qb.distinct(true);
    }

    qb.orderBy('offer.createdAt', 'DESC')
      .addOrderBy('offer.id', 'ASC')
      .skip(offset)
      .take(limit);

    const [items, total] = await Promise.all([
      qb.getMany(),
      includeTotal
        ? this.countMine(sellerId, query, needsCategoryFilter)
        : Promise.resolve(null),
    ]);

    const products = await this.productsService.findByIds(
      items.map((offer) => offer.productId),
      'list',
    );
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const resolvedTotal =
      total ??
      (items.length === limit
        ? offset + items.length + 1
        : offset + items.length);

    return paginatedList(
      items.map((offer) =>
        toOfferListResponse(offer, productById.get(offer.productId)),
      ),
      page,
      limit,
      resolvedTotal,
    );
  }

  private async countMine(
    sellerId: string,
    query: ListMySellerOffersDto,
    needsCategoryFilter: boolean,
  ): Promise<number> {
    const qb = this.offers
      .createQueryBuilder('offer')
      .select('offer.id')
      .where('offer.sellerId = :sellerId', { sellerId });

    if (query.approvalStatus) {
      qb.andWhere('offer.approvalStatus = :approvalStatus', {
        approvalStatus: query.approvalStatus,
      });
    }
    if (query.productId) {
      qb.andWhere('offer.productId = :productId', {
        productId: query.productId,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('offer.isActive = :isActive', { isActive: query.isActive });
    }
    if (needsCategoryFilter) {
      this.applyProductCategoryFilter(qb, query);
      qb.distinct(true);
    }

    return qb.getCount();
  }

  private applyListFilters(
    qb: SelectQueryBuilder<SellerOffer>,
    query: ListSellerOffersDto,
    needsCategoryFilter: boolean,
    viewerSellerId?: string | null,
  ) {
    // عمومی: فقط approved
    // فروشنده لاگین‌شده: approved همه + pending/rejected خودش
    if (viewerSellerId) {
      qb.andWhere(
        `(offer.approvalStatus = :approved
          OR (offer.sellerId = :viewerSellerId AND offer.approvalStatus IN (:...ownStatuses)))`,
        {
          approved: 'approved',
          viewerSellerId,
          ownStatuses: ['pending', 'rejected'],
        },
      );
      if (query.approvalStatus) {
        if (query.approvalStatus === 'approved') {
          qb.andWhere('offer.approvalStatus = :filterApproved', {
            filterApproved: 'approved',
          });
        } else {
          // pending/rejected فقط برای آفرهای خود فروشنده
          qb.andWhere(
            'offer.sellerId = :viewerSellerId AND offer.approvalStatus = :ownStatus',
            {
              viewerSellerId,
              ownStatus: query.approvalStatus,
            },
          );
        }
      }
    } else {
      qb.andWhere('offer.approvalStatus = :approved', { approved: 'approved' });
    }

    for (const field of ['sellerId', 'productId', 'isActive'] as const) {
      if (query[field] !== undefined) {
        qb.andWhere(`offer.${field} = :${field}`, { [field]: query[field] });
      }
    }

    if (needsCategoryFilter) {
      this.applyProductCategoryFilter(qb, query);
      qb.distinct(true);
    }

    return qb;
  }

  private applyProductCategoryFilter(
    qb: SelectQueryBuilder<SellerOffer>,
    query: { categoryId?: string; subCategoryId?: string },
  ) {
    qb.innerJoin('offer.product', 'filterProduct').innerJoin(
      'filterProduct.productCategories',
      'pcFilter',
    );
    if (query.categoryId) {
      qb.andWhere(
        `(pcFilter.categoryId = :categoryId
          OR pcFilter.subCategoryId IN (
            SELECT sc_filter.id FROM sub_categories sc_filter
            WHERE sc_filter.categoryId = :categoryId
          ))`,
        { categoryId: query.categoryId },
      );
    }
    if (query.subCategoryId) {
      qb.andWhere(
        `(pcFilter.subCategoryId = :subCategoryId
          OR pcFilter.categoryId = :subCategoryId)`,
        { subCategoryId: query.subCategoryId },
      );
    }
  }

  private isUnfilteredApprovedList(
    query: ListSellerOffersDto,
    viewerSellerId?: string | null,
  ): boolean {
    return (
      !viewerSellerId &&
      query.sellerId === undefined &&
      query.productId === undefined &&
      query.isActive === undefined &&
      query.approvalStatus === undefined &&
      !query.categoryId &&
      !query.subCategoryId
    );
  }

  private async resolveListTotal(
    query: ListSellerOffersDto,
    needsCategoryFilter: boolean,
    viewerSellerId?: string | null,
  ): Promise<number> {
    if (this.isUnfilteredApprovedList(query, viewerSellerId)) {
      return this.getCachedApprovedCount();
    }

    return this.applyListFilters(
      this.offers.createQueryBuilder('offer').select('offer.id'),
      query,
      needsCategoryFilter,
      viewerSellerId,
    ).getCount();
  }

  private async getCachedApprovedCount(): Promise<number> {
    const now = Date.now();
    if (this.approvedCountCache && this.approvedCountCache.expiresAt > now) {
      return this.approvedCountCache.value;
    }

    const value = await this.offers
      .createQueryBuilder('offer')
      .where('offer.approvalStatus = :approved', { approved: 'approved' })
      .getCount();

    this.approvedCountCache = {
      value,
      expiresAt: now + OffersService.APPROVED_COUNT_TTL_MS,
    };
    return value;
  }

  private invalidateApprovedCountCache() {
    this.approvedCountCache = null;
  }

  /** sellerIdهای فعال/تأییدشده به ازای هر productId */
  async findApprovedSellerIdsByProductIds(
    productIds: string[],
  ): Promise<Map<string, string[]>> {
    const byProduct = new Map<string, string[]>();
    if (productIds.length === 0) return byProduct;

    const rows = await this.offers
      .createQueryBuilder('offer')
      .select('offer.productId', 'productId')
      .addSelect('offer.sellerId', 'sellerId')
      .where('offer.productId IN (:...productIds)', { productIds })
      .andWhere('offer.isActive = true')
      .andWhere("offer.approvalStatus = 'approved'")
      .distinct(true)
      .getRawMany<{ productId: string; sellerId: string }>();

    for (const row of rows) {
      const list = byProduct.get(row.productId) ?? [];
      list.push(row.sellerId);
      byProduct.set(row.productId, list);
    }
    return byProduct;
  }

  async getEntity(id: string) {
    const offer = await this.offers.findOne({
      where: { id },
      relations: { seller: true, product: true },
    });
    if (!offer)
      throw new ApiException(
        'OFFER_NOT_FOUND',
        'پیشنهاد فروش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    return offer;
  }

  async findOne(id: string) {
    const offer = await this.getEntity(id);
    const product = await this.productsService.findOne(offer.productId);
    return toOfferResponse(offer, product);
  }

  async create(user: AuthUser, dto: CreateSellerOffersDto) {
    const sellerId = user.sellerId;
    if (!sellerId) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فروشنده در توکن احراز هویت مشخص نشده است',
        HttpStatus.FORBIDDEN,
      );
    }

    assertOfferAccess(user, sellerId);
    if (!(await this.sellers.existsBy({ id: sellerId })))
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );

    const skus = dto.items.map((item) => item.sku);
    if (new Set(skus).size !== skus.length) {
      throw new ApiException(
        'OFFER_SKU_DUPLICATE',
        'SKU تکراری در لیست درخواست وجود دارد',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const sku of skus) {
      if (await this.offers.existsBy({ sku })) {
        throw new ApiException(
          'OFFER_EXISTS',
          `SKU تکراری است: ${sku}`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const productIds = [
      ...new Set(
        dto.items
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const products =
      productIds.length > 0
        ? await this.products.findBy({ id: In(productIds) })
        : [];
    const productMap = new Map(products.map((product) => [product.id, product]));

    const created = [];
    for (const item of dto.items) {
      created.push(await this.createOne(sellerId, item, productMap));
    }
    return created;
  }

  private slugifySku(sku: string): string {
    const slug = sku
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);
    return slug || `offer-${Date.now()}`;
  }

  private async ensureProductForOffer(
    sellerId: string,
    item: SellerOfferItemDto,
    productMap: Map<string, Product>,
  ): Promise<Product> {
    if (item.productId) {
      const existing =
        productMap.get(item.productId) ??
        (await this.products.findOneBy({ id: item.productId }));
      if (existing) {
        productMap.set(existing.id, existing);
        if (item.product && Object.keys(item.product).length > 0) {
          await this.productsService.update(existing.id, item.product);
          const refreshed = await this.products.findOneBy({ id: existing.id });
          if (refreshed) {
            productMap.set(refreshed.id, refreshed);
            return refreshed;
          }
        }
        return existing;
      }
    }

    const patch = item.product ?? {};
    const name = patch.name?.trim() || item.sku;
    const slug = patch.slug?.trim() || this.slugifySku(item.sku);
    const sku = patch.sku?.trim() || item.sku;

    const created = await this.productsService.create(
      {
        ...patch,
        name,
        slug,
        sku,
        stock: patch.stock ?? item.stock,
        taxStatus: patch.taxStatus ?? item.taxStatus ?? undefined,
        taxClass: patch.taxClass ?? item.taxClass ?? undefined,
        price:
          patch.price ??
          ([
            {
              price: item.price,
              finalPrice: item.price,
            },
          ] as CreateProductDto['price']),
        sellerIds: [...new Set([...(patch.sellerIds ?? []), sellerId])],
        approvalStatus: 'pending',
        status: patch.status ?? 'draft',
      },
      { createSellerOffer: false },
    );

    const entity = await this.products.findOneBy({ id: created.id });
    if (!entity) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول ساخته‌شده یافت نشد',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    productMap.set(entity.id, entity);
    return entity;
  }

  private async createOne(
    sellerId: string,
    item: SellerOfferItemDto,
    productMap: Map<string, Product>,
  ) {
    const product = await this.ensureProductForOffer(
      sellerId,
      item,
      productMap,
    );
    const approvalStatus =
      product.approvalStatus === 'approved' ? 'approved' : 'pending';

    return this.save(
      this.offers.create({
        sellerId,
        productId: product.id,
        sku: item.sku,
        price: item.price,
        stock: item.stock,
        stockStatus: item.stockStatus,
        attributes: {},
        isOnSale: item.isOnSale ?? false,
        isActive: item.isActive ?? true,
        taxStatus: item.taxStatus ?? null,
        taxClass: item.taxClass ?? null,
        approvalStatus,
        rejectionReason: null,
      }),
    );
  }

  /**
   * اگر برای (seller, product) هنوز آفر نباشد، یک آفر pending می‌سازد.
   * برای وقتی محصول از POST /products ساخته شده و باید در seller-offers/me دیده شود.
   */
  async ensureDefaultOfferForProduct(
    product: Product,
    sellerId: string,
  ): Promise<SellerOffer | null> {
    const existing = await this.offers.findOne({
      where: { productId: product.id, sellerId },
    });
    if (existing) return existing;

    const prices = Array.isArray(product.price)
      ? product.price
      : product.price
        ? [product.price]
        : [];
    const unitPrice = Number(prices[0]?.finalPrice ?? prices[0]?.price ?? 0);
    const stockRow = await this.productStockRepository.findByProductId(
      product.id,
    );
    const stock = Number(stockRow?.stock ?? 0);

    try {
      const saved = await this.offers.save(
        this.offers.create({
          sellerId,
          productId: product.id,
          sku: product.sku,
          price: Number.isFinite(unitPrice) ? unitPrice : 0,
          stock,
          stockStatus: stock > 0 ? 'instock' : 'outofstock',
          attributes: {},
          isOnSale: false,
          isActive: true,
          taxStatus: product.taxStatus ?? null,
          taxClass: product.taxClass ?? null,
          approvalStatus:
            product.approvalStatus === 'approved' ? 'approved' : 'pending',
          rejectionReason: null,
        }),
      );
      this.invalidateApprovedCountCache();
      return saved;
    } catch (error) {
      const err = error as { code?: string | number; errno?: number };
      if (
        err.code === '23505' ||
        err.code === 'ER_DUP_ENTRY' ||
        err.errno === 1062 ||
        String(err.code) === '1062'
      ) {
        return (
          (await this.offers.findOne({
            where: { productId: product.id, sellerId },
          })) ?? null
        );
      }
      throw error;
    }
  }

  /**
   * وقتی محصول سازنده از PATCH /products/:id/approval تأیید/رد می‌شود،
   * آفر همان فروشنده روی آن محصول هم هم‌وضعیت می‌شود.
   */
  async syncOfferApprovalForSellerProduct(
    productId: string,
    sellerId: string,
    approvalStatus: 'pending' | 'approved' | 'rejected',
    rejectionReason: string | null,
  ): Promise<void> {
    const offer = await this.offers.findOne({
      where: { productId, sellerId },
    });
    if (!offer) return;

    offer.approvalStatus = approvalStatus;
    offer.rejectionReason =
      approvalStatus === 'rejected' ? rejectionReason : null;
    await this.offers.save(offer);
    this.invalidateApprovedCountCache();
  }

  async update(user: AuthUser, id: string, dto: UpdateSellerOfferDto) {
    const offer = await this.getEntity(id);
    assertOfferAccess(user, offer.sellerId);

    const { product: productPatch, ...offerFields } = dto;

    if (productPatch && Object.keys(productPatch).length > 0) {
      // ویرایش از مسیر آفر نباید approvalStatus محصول را عوض کند
      await this.productsService.update(offer.productId, productPatch, {
        preserveApprovalStatus: true,
      });
    }

    if (
      offerFields.sku !== undefined &&
      offerFields.sku !== offer.sku &&
      (await this.offers.existsBy({ sku: offerFields.sku }))
    ) {
      throw new ApiException(
        'OFFER_EXISTS',
        `SKU تکراری است: ${offerFields.sku}`,
        HttpStatus.CONFLICT,
      );
    }

    Object.assign(offer, offerFields);
    // هر ویرایش محتوا → آفر دوباره نیاز به تأیید دارد
    offer.approvalStatus = 'pending';
    offer.rejectionReason = null;

    return this.save(offer, true);
  }

  async review(id: string, dto: ReviewSellerOfferDto) {
    const offer = await this.getEntity(id);

    if (dto.approvalStatus === 'rejected') {
      const reason = dto.rejectionReason?.trim();
      if (!reason) {
        throw new ApiException(
          'REJECTION_REASON_REQUIRED',
          'برای رد پیشنهاد باید دلیل وارد شود',
          HttpStatus.BAD_REQUEST,
        );
      }
      offer.approvalStatus = 'rejected';
      offer.rejectionReason = reason;
    } else if (dto.approvalStatus === 'approved') {
      offer.approvalStatus = 'approved';
      offer.rejectionReason = null;
      // تأیید آفر → محصول لینک‌شده هم تأیید و publish می‌شود
      const product =
        offer.product ??
        (await this.products.findOneBy({ id: offer.productId }));
      if (!product) {
        throw new ApiException(
          'PRODUCT_NOT_FOUND',
          'محصول این پیشنهاد یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      product.approvalStatus = 'approved';
      product.rejectionReason = null;
      if (product.status !== 'publish') {
        product.status = 'publish';
      }
      await this.products.save(product);
    } else {
      offer.approvalStatus = 'pending';
      offer.rejectionReason = null;
    }

    return this.save(offer, true);
  }

  async remove(user: AuthUser, id: string) {
    const offer = await this.getEntity(id);
    assertOfferAccess(user, offer.sellerId);
    try {
      await this.offers.delete(id);
      this.invalidateApprovedCountCache();
    } catch (error) {
      if ((error as { code?: string }).code === '23503')
        throw new ApiException(
          'OFFER_IN_USE',
          'پیشنهاد در سفارش استفاده شده؛ آن را غیرفعال کنید',
          HttpStatus.CONFLICT,
        );
      throw error;
    }
    return {};
  }

  private async save(offer: SellerOffer, includeProduct = false) {
    try {
      const saved = await this.offers.save(offer);
      this.invalidateApprovedCountCache();
      if (!includeProduct) return toOfferResponse(saved);
      const product = await this.productsService.findOne(saved.productId);
      return toOfferResponse(saved, product);
    } catch (error) {
      const err = error as { code?: string | number; errno?: number };
      if (
        err.code === '23505' ||
        err.code === 'ER_DUP_ENTRY' ||
        err.errno === 1062 ||
        String(err.code) === '1062'
      )
        throw new ApiException(
          'OFFER_EXISTS',
          'SKU تکراری است',
          HttpStatus.CONFLICT,
        );
      throw error;
    }
  }

  async resolvePurchasable(id: string, quantity: number) {
    const offer = await this.getEntity(id);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !offer.isActive ||
      offer.approvalStatus !== 'approved' ||
      offer.seller.status !== 'active' ||
      offer.product.status !== 'publish' ||
      offer.product.approvalStatus !== 'approved' ||
      offer.product.isActive === false ||
      offer.stockStatus !== 'instock' ||
      offer.stock < quantity
    )
      throw new ApiException(
        'OFFER_UNAVAILABLE',
        'پیشنهاد فروش یا موجودی موردنیاز در دسترس نیست',
        HttpStatus.BAD_REQUEST,
      );
    const price = Number(offer.price);
    if (!Number.isFinite(price) || price <= 0)
      throw new ApiException(
        'OFFER_PRICE_INVALID',
        'قیمت پیشنهاد فروش معتبر نیست',
        HttpStatus.BAD_REQUEST,
      );
    return {
      offerId: offer.id,
      productId: offer.productId,
      attributes: offer.attributes ?? {},
      sellerId: offer.sellerId,
      sku: offer.sku,
      quantity,
      unitPrice: price,
    };
  }

  /** کم‌کردن اتمیک موجودی آفر — بدون نگه‌داشتن لاک روی product */
  async tryDecrementStock(
    offerId: string,
    quantity: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    if (!Number.isInteger(quantity) || quantity < 1) return false;
    const repo = manager ? manager.getRepository(SellerOffer) : this.offers;

    const result = await repo
      .createQueryBuilder()
      .update(SellerOffer)
      .set({
        stock: () => '`stock` - :quantity',
        stockStatus: () =>
          "CASE WHEN `stock` - :quantity <= 0 THEN 'outofstock' ELSE `stockStatus` END",
      })
      .where('id = :offerId')
      .andWhere('`stock` >= :quantity')
      .andWhere('`stockStatus` = :stockStatus', { stockStatus: 'instock' })
      .setParameters({ offerId, quantity })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /** کم‌کردن موجودی آفر + محصول برای خرید — متعلق به لایهٔ stock/offers */
  async decrementStockForPurchase(
    items: { offerId: string; productId: string; quantity: number }[],
    manager: EntityManager,
  ): Promise<void> {
    for (const item of items) {
      const offerOk = await this.tryDecrementStock(
        item.offerId,
        item.quantity,
        manager,
      );
      if (!offerOk) {
        throw new ApiException(
          'OFFER_UNAVAILABLE',
          'پیشنهاد فروش یا موجودی موردنیاز در دسترس نیست',
          HttpStatus.CONFLICT,
        );
      }

      const productOk = await this.productStockRepository.tryDecrement(
        item.productId,
        item.quantity,
        manager,
      );
      if (!productOk) {
        throw new ApiException(
          'PRODUCT_OUT_OF_STOCK',
          'موجودی محصول کافی نیست',
          HttpStatus.CONFLICT,
        );
      }
    }
  }
}
