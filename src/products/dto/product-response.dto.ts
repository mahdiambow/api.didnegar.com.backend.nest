import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Brand } from '../entities/brand.entity.js';
import { Product } from '../entities/product.entity.js';

export class BrandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  createdAt: Date;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescription: string | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ nullable: true })
  brandId: string | null;

  @ApiPropertyOptional({ nullable: true })
  minPrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxPrice: number | null;

  @ApiProperty()
  isVirtual: boolean;

  @ApiProperty()
  isDownloadable: boolean;

  @ApiPropertyOptional({ nullable: true })
  stockQuantity: number | null;

  @ApiPropertyOptional({ nullable: true })
  stockStatus: string | null;

  @ApiProperty()
  isOnSale: boolean;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalSales: number;

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
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: BrandResponseDto, nullable: true })
  brand?: BrandResponseDto | null;
}

export function toBrandResponse(brand: Brand): BrandResponseDto {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    createdAt: brand.createdAt,
  };
}

export function toProductResponse(
  product: Product,
  includeBrand = false,
): ProductResponseDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    status: product.status,
    sku: product.sku,
    brandId: product.brandId,
    minPrice: product.minPrice !== null ? Number(product.minPrice) : null,
    maxPrice: product.maxPrice !== null ? Number(product.maxPrice) : null,
    isVirtual: product.isVirtual,
    isDownloadable: product.isDownloadable,
    stockQuantity: product.stockQuantity,
    stockStatus: product.stockStatus,
    isOnSale: product.isOnSale,
    ratingCount: product.ratingCount,
    averageRating: Number(product.averageRating),
    totalSales: product.totalSales,
    taxStatus: product.taxStatus,
    taxClass: product.taxClass,
    weight: product.weight !== null ? Number(product.weight) : null,
    length: product.length !== null ? Number(product.length) : null,
    width: product.width !== null ? Number(product.width) : null,
    height: product.height !== null ? Number(product.height) : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    brand:
      includeBrand && product.brand
        ? toBrandResponse(product.brand)
        : undefined,
  };
}
