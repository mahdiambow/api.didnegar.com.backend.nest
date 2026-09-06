import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import { SellerOffer } from './entities/seller-offer.entity.js';
import {
  CreateSellerOfferDto,
  ListSellerOffersDto,
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
export const toOfferResponse = (offer: SellerOffer) => ({
  offerId: offer.id,
  sellerId: offer.sellerId,
  variantId: offer.variantId,
  sku: offer.sku,
  price: Number(offer.price),
  stockQuantity: offer.stockQuantity,
  stockStatus: offer.stockStatus,
  isOnSale: offer.isOnSale,
  taxStatus: offer.taxStatus,
  taxClass: offer.taxClass,
  isActive: offer.isActive,
  createdAt: offer.createdAt,
  updatedAt: offer.updatedAt,
});
@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(SellerOffer)
    private readonly offers: Repository<SellerOffer>,
    @InjectRepository(Seller) private readonly sellers: Repository<Seller>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}
  async findAll(query: ListSellerOffersDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.offers
      .createQueryBuilder('offer')
      .innerJoin('offer.variant', 'variant');
    for (const field of ['sellerId', 'variantId', 'isActive'] as const)
      if (query[field] !== undefined)
        qb.andWhere(`offer.${field} = :${field}`, { [field]: query[field] });
    if (query.productId)
      qb.andWhere('variant.productId = :productId', {
        productId: query.productId,
      });
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
      relations: { seller: true, variant: { product: true } },
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
  async create(user: AuthUser, dto: CreateSellerOfferDto) {
    assertOfferAccess(user, dto.sellerId);
    if (!(await this.sellers.existsBy({ id: dto.sellerId })))
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    if (!(await this.variants.existsBy({ id: dto.variantId })))
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'تنوع محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    return this.save(
      this.offers.create({
        ...dto,
        isOnSale: dto.isOnSale ?? false,
        isActive: dto.isActive ?? true,
      }),
    );
  }
  async update(user: AuthUser, id: string, dto: UpdateSellerOfferDto) {
    const offer = await this.getEntity(id);
    assertOfferAccess(user, offer.sellerId);
    Object.assign(offer, dto);
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
          'پیشنهاد این تنوع یا SKU برای فروشنده تکراری است',
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
      offer.seller.status !== 'active' ||
      offer.variant.product.status !== 'publish' ||
      offer.stockStatus !== 'instock' ||
      offer.stockQuantity < quantity
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
      productId: offer.variant.productId,
      variantId: offer.variantId,
      sellerId: offer.sellerId,
      sku: offer.sku,
      quantity,
      unitPrice: price,
    };
  }
}
