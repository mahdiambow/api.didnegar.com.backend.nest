import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategoryResponseDto } from '../../categories/dto/category-response.dto.js';
import { toProductCategoryResponse } from '../../categories/dto/category-response.dto.js';
import { PRODUCT_CATEGORY_RESPONSE_EXAMPLE } from '../../categories/dto/category.examples.js';
import {
  ProductAttributeResponseDto,
  toProductAttributeResponse,
} from './product-variant-response.dto.js';
import { PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE } from './product-variant.examples.js';
import { Brand } from '../entities/brand.entity.js';
import { Product } from '../entities/product.entity.js';
import { BRAND_EXAMPLES, BRAND_RESPONSE_EXAMPLE } from './brand.examples.js';

export class BrandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
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

  @ApiProperty({
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
    description: 'وضعیت تأیید ادمین',
  })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({
    nullable: true,
    example: 'تصاویر محصول ناقص است',
  })
  rejectionReason: string | null;

  @ApiPropertyOptional({ nullable: true, example: BRAND_EXAMPLES.brandId })
  brandId: string | null;

  @ApiProperty()
  isVirtual: boolean;

  @ApiProperty()
  isDownloadable: boolean;

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

  @ApiProperty({
    example: { color: ['قرمز', 'مشکی'], storage: ['256GB', '512GB'] },
    description: 'ویژگی‌های مجاز محصول برای قیمت‌گذاری فروشنده',
    additionalProperties: { type: 'array', items: { type: 'string' } },
  })
  attributes: Record<string, string[]>;

  @ApiProperty({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440002'],
    description: 'آرایه شناسه فروشنده‌های مرتبط با محصول',
  })
  sellerIds: string[];

  @ApiPropertyOptional({
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'فروشنده‌ای که محصول را اول ثبت کرده',
  })
  createdBySellerId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: BrandResponseDto,
    nullable: true,
    example: BRAND_RESPONSE_EXAMPLE,
  })
  brand?: BrandResponseDto | null;

  @ApiPropertyOptional({
    type: [String],
    example: [PRODUCT_CATEGORY_RESPONSE_EXAMPLE.subCategoryId],
    description: 'شناسه category/subCategoryهای محصول',
  })
  categoryIds?: string[];

  @ApiPropertyOptional({
    type: [ProductCategoryResponseDto],
    example: [PRODUCT_CATEGORY_RESPONSE_EXAMPLE],
    description: 'دسته‌های populate‌شده — شامل subCategory و category',
  })
  categories?: ProductCategoryResponseDto[];

  @ApiPropertyOptional({
    type: [ProductAttributeResponseDto],
    example: [PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE],
    description: 'product-attributeهای populate‌شده',
  })
  variants?: ProductAttributeResponseDto[];
}

export function toBrandResponse(brand: Brand): BrandResponseDto {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

export function toProductResponse(
  product: Product,
  includeRelations = false,
): ProductResponseDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    status: product.status,
    approvalStatus: product.approvalStatus ?? 'pending',
    rejectionReason: product.rejectionReason ?? null,
    brandId: product.brandId,
    isVirtual: product.isVirtual,
    isDownloadable: product.isDownloadable,
    ratingCount: product.ratingCount,
    averageRating: Number(product.averageRating),
    totalSales: product.totalSales,
    taxStatus: product.taxStatus,
    taxClass: product.taxClass,
    weight: product.weight !== null ? Number(product.weight) : null,
    length: product.length !== null ? Number(product.length) : null,
    width: product.width !== null ? Number(product.width) : null,
    height: product.height !== null ? Number(product.height) : null,
    attributes: product.attributes ?? {},
    sellerIds: product.sellerIds ?? [],
    createdBySellerId: product.createdBySellerId ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    brand:
      includeRelations && product.brand
        ? toBrandResponse(product.brand)
        : undefined,
    categories:
      includeRelations && product.productCategories
        ? product.productCategories.map(toProductCategoryResponse)
        : undefined,
    categoryIds:
      includeRelations && product.productCategories
        ? product.productCategories.map(
            (item) => item.subCategoryId ?? item.categoryId!,
          )
        : undefined,
    variants:
      includeRelations && product.variants
        ? product.variants.map((item) => toProductAttributeResponse(item, true))
        : undefined,
  };
}
