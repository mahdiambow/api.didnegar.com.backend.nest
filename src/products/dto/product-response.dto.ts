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
import type {
  ProductImageData,
  ProductPriceData,
  ProductSeoItem,
  ProductShippingMethodData,
  ProductTableInfoItem,
} from '../entities/product.entity.js';
import { BRAND_EXAMPLES, BRAND_RESPONSE_EXAMPLE } from './brand.examples.js';
import {
  ProductImageDto,
  ProductKeyValDto,
  ProductPriceDto,
  ProductShippingMethodDto,
  ProductTableInfoDto,
} from './product-fields.dto.js';

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

  @ApiPropertyOptional({ nullable: true, example: 'پرچمدار سامسونگ ۲۰۲۴' })
  subtitle: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'خلاصه کوتاه محصول برای لیست‌ها',
  })
  excerpt: string | null;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'SAM-S24U-256' })
  sku: string;

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

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiProperty({
    example: 10,
    description: 'موجودی محصول از جدول product_stocks',
  })
  stock: number;

  @ApiProperty({
    type: [ProductKeyValDto],
    example: [{ key: 'meta_title', val: 'خرید Galaxy S24' }],
  })
  seo: ProductSeoItem[];

  @ApiProperty({
    type: ProductImageDto,
    example: {
      featuredImg: 'https://cdn.example.com/products/s24-featured.jpg',
      gallery: ['https://cdn.example.com/products/s24-1.jpg'],
    },
  })
  image: ProductImageData;

  @ApiPropertyOptional({
    type: ProductPriceDto,
    nullable: true,
    example: {
      attributeIds: ['550e8400-e29b-41d4-a716-446655440060'],
      price: 68000000,
      discountPercentage: 10,
      discountAmount: 2000000,
      expireDate: '2026-12-31T23:59:59.000Z',
      maxQuantity: 5,
      minQuantity: 1,
      finalPrice: 66000000,
    },
  })
  price: ProductPriceData | null;

  @ApiPropertyOptional({
    type: ProductShippingMethodDto,
    nullable: true,
    example: {
      slug: 'tipax-cod',
      name: 'تیپاکس (پس کرایه)',
      price: 75000,
      isCod: true,
      isActive: true,
      sortOrder: 0,
    },
  })
  shippingMethod: ProductShippingMethodData | null;

  @ApiProperty({
    type: [ProductTableInfoDto],
    example: [
      {
        name: 'مشخصات فنی',
        items: [{ key: 'وزن', val: '۲۳۳ گرم' }],
      },
    ],
  })
  tableInfo: ProductTableInfoItem[];

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
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440060'],
    description: 'شناسه ویژگی‌های محصول (Attribute IDs)',
  })
  attributeIds: string[];

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

function normalizeImage(image: Product['image']): ProductImageData {
  return {
    featuredImg: image?.featuredImg ?? null,
    gallery: Array.isArray(image?.gallery) ? image.gallery : [],
  };
}

export function toProductResponse(
  product: Product,
  includeRelations = false,
): ProductResponseDto {
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle ?? null,
    excerpt: product.excerpt ?? null,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    status: product.status,
    approvalStatus: product.approvalStatus ?? 'pending',
    rejectionReason: product.rejectionReason ?? null,
    brandId: product.brandId,
    isVirtual: product.isVirtual,
    isDownloadable: product.isDownloadable,
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured ?? false,
    stock: product.productStock?.stock ?? 0,
    seo: product.seo ?? [],
    image: normalizeImage(product.image),
    price: product.price ?? null,
    shippingMethod: product.shippingMethod ?? null,
    tableInfo: product.tableInfo ?? [],
    ratingCount: product.ratingCount,
    averageRating: Number(product.averageRating),
    totalSales: product.totalSales,
    taxStatus: product.taxStatus,
    taxClass: product.taxClass,
    weight: product.weight !== null ? Number(product.weight) : null,
    length: product.length !== null ? Number(product.length) : null,
    width: product.width !== null ? Number(product.width) : null,
    height: product.height !== null ? Number(product.height) : null,
    attributeIds: product.attributeIds ?? [],
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
        ? product.variants.map((item) => toProductAttributeResponse(item))
        : undefined,
  };
}
