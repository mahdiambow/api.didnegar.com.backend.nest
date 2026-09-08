import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { SellerOffer } from './entities/seller-offer.entity.js';
import {
  CreateSellerOffersDto,
  ListSellerOffersDto,
  OFFER_IMMEDIATE_FIELDS,
  ReviewSellerOfferDto,
  SellerOfferItemDto,
  UpdateSellerOfferDto,
} from './dto/seller-offer.dto.js';

export function assertOfferAccess(user: AuthUser, sellerId: string) {
  if (user.role === 'super-admin') return;
  if (
    !user.sellerId ||
    user.sellerId !== sellerId ||
    !['seller', 'admin'].includes(user.role)
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

export const toOfferResponse = (offer: SellerOffer) => ({
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
  createdAt: offer.createdAt,
  updatedAt: offer.updatedAt,
});

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(SellerOffer)
    private readonly offers: Repository<SellerOffer>,
    @InjectRepository(Seller) private readonly sellers: Repository<Seller>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async findAll(query: ListSellerOffersDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.offers.createQueryBuilder('offer');
    for (const field of [
      'sellerId',
      'productId',
      'isActive',
      'approvalStatus',
    ] as const)
      if (query[field] !== undefined)
        qb.andWhere(`offer.${field} = :${field}`, { [field]: query[field] });
    const [items, total] = await qb
      .orderBy('offer.price', 'ASC')
      .addOrderBy('offer.id', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return paginatedList(items.map(toOfferResponse), page, limit, total);
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
    return toOfferResponse(await this.getEntity(id));
  }

  async create(user: AuthUser, dto: CreateSellerOffersDto) {
    assertOfferAccess(user, dto.sellerId);
    if (!(await this.sellers.existsBy({ id: dto.sellerId })))
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

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.products.findBy({ id: In(productIds) });
    const productMap = new Map(products.map((product) => [product.id, product]));
    for (const productId of productIds) {
      if (!productMap.has(productId)) {
        throw new ApiException(
          'PRODUCT_NOT_FOUND',
          `محصول یافت نشد: ${productId}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const created = [];
    for (const item of dto.items) {
      created.push(await this.createOne(dto.sellerId, item, productMap));
    }
    return created;
  }

  private async createOne(
    sellerId: string,
    item: SellerOfferItemDto,
    productMap: Map<string, Product>,
  ) {
    const product = productMap.get(item.productId)!;
    const approvalStatus =
      product.approvalStatus === 'approved' ? 'approved' : 'pending';

    return this.save(
      this.offers.create({
        sellerId,
        productId: item.productId,
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

  async update(user: AuthUser, id: string, dto: UpdateSellerOfferDto) {
    const offer = await this.getEntity(id);
    assertOfferAccess(user, offer.sellerId);

    Object.assign(offer, dto);
    offer.approvalStatus = 'approved';
    offer.rejectionReason = null;

    return this.save(offer);
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
    } else {
      offer.approvalStatus = 'pending';
      offer.rejectionReason = null;
    }

    return this.save(offer);
  }

  async remove(user: AuthUser, id: string) {
    const offer = await this.getEntity(id);
    assertOfferAccess(user, offer.sellerId);
    try {
      await this.offers.delete(id);
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

  private async save(offer: SellerOffer) {
    try {
      return toOfferResponse(await this.offers.save(offer));
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ApiException(
          'OFFER_EXISTS',
          'SKU برای این فروشنده تکراری است',
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
      attributes: {},
      sellerId: offer.sellerId,
      sku: offer.sku,
      quantity,
      unitPrice: price,
    };
  }
}
