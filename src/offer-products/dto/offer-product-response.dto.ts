import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { OfferProduct } from '../entities/offer-product.entity.js';

export class OfferProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ nullable: true })
  brandId: string | null;

  @ApiProperty({ type: [String] })
  categoryIds: string[];

  @ApiProperty()
  attributes: Record<string, string[]>;

  @ApiProperty()
  isVirtual: boolean;

  @ApiProperty()
  isDownloadable: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  taxStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxClass: string | null;

  @ApiPropertyOptional({ nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ nullable: true })
  length: number | null;

  @ApiPropertyOptional({ nullable: true })
  width: number | null;

  @ApiPropertyOptional({ nullable: true })
  height: number | null;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  stockStatus: string;

  @ApiProperty()
  isOnSale: boolean;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;

  @ApiPropertyOptional({ nullable: true })
  productId: string | null;

  @ApiPropertyOptional({ nullable: true })
  offerId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toOfferProductResponse(
  item: OfferProduct,
): OfferProductResponseDto {
  return {
    id: item.id,
    sellerId: item.sellerId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    shortDescription: item.shortDescription,
    brandId: item.brandId,
    categoryIds: item.categoryIds ?? [],
    attributes: item.attributes ?? {},
    isVirtual: item.isVirtual,
    isDownloadable: item.isDownloadable,
    isActive: item.isActive,
    taxStatus: item.taxStatus,
    taxClass: item.taxClass,
    weight: item.weight !== null ? Number(item.weight) : null,
    length: item.length !== null ? Number(item.length) : null,
    width: item.width !== null ? Number(item.width) : null,
    height: item.height !== null ? Number(item.height) : null,
    sku: item.sku,
    price: Number(item.price),
    stock: item.stock,
    stockStatus: item.stockStatus,
    isOnSale: item.isOnSale,
    approvalStatus: item.approvalStatus,
    rejectionReason: item.rejectionReason,
    productId: item.productId,
    offerId: item.offerId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
