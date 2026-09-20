import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategoryResponseDto } from '../../categories/dto/category-response.dto.js';
import { toProductCategoryResponse } from '../../categories/dto/category-response.dto.js';
import { PRODUCT_CATEGORY_RESPONSE_EXAMPLE } from '../../categories/dto/category.examples.js';
import {
  Product,
  getPriceValueAttributeIds,
} from '../entities/product.entity.js';
import type {
  ProductImageData,
  ProductPriceData,
  ProductSeoItem,
  ProductTableInfoItem,
} from '../entities/product.entity.js';
import {
  BrandResponseDto,
  toBrandResponse,
} from '../../brands/dto/brand-response.dto.js';
import {
  BRAND_EXAMPLES,
  BRAND_RESPONSE_EXAMPLE,
} from '../../brands/dto/brand.examples.js';
import {
  AttributeResponseDto,
  toAttributeResponse,
} from '../../attributes/dto/attribute-response.dto.js';
import { ATTRIBUTE_RESPONSE_EXAMPLE } from '../../attributes/dto/attribute.examples.js';
import {
  AttributeValueResponseDto,
  toAttributeValueResponse,
} from '../../attributes/dto/attribute-value.dto.js';
import {
  SellerResponseDto,
  toSellerResponse,
} from '../../sellers/dto/seller-response.dto.js';
import {
  ProductImageDto,
  ProductKeyValDto,
  ProductTableInfoDto,
} from './product-fields.dto.js';
import {
  ShippingMethodResponseDto,
  toShippingMethodResponse,
} from '../../shipping/dto/shipping.dto.js';

export { BrandResponseDto, toBrandResponse };
export { AttributeResponseDto, toAttributeResponse };
export { SellerResponseDto, toSellerResponse };
export { AttributeValueResponseDto, toAttributeValueResponse };

export type ProductPopulatedRelations = {
  attributes?: AttributeResponseDto[];
  valueAttributes?: AttributeValueResponseDto[];
  createdBySeller?: SellerResponseDto | null;
  shippingMethod?: ShippingMethodResponseDto | null;
  /** valueId → AttributeValue — برای populate کردن price.valueAttributes */
  attributeValueById?: Map<string, AttributeValueResponseDto>;
};

export class ProductPriceResponseDto {
  @ApiProperty({
    type: [AttributeValueResponseDto],
    description: 'مقادیر ویژگی مرتبط با این قیمت (به‌جای attributeIds)',
  })
  valueAttributes: AttributeValueResponseDto[];

  @ApiPropertyOptional({ example: 68000000, nullable: true })
  price: number | null;

  @ApiPropertyOptional({ example: 10, nullable: true })
  discountPercentage: number | null;

  @ApiPropertyOptional({ example: 2000000, nullable: true })
  discountAmount: number | null;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    nullable: true,
  })
  expireDate: string | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  maxQuantity: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  minQuantity: number | null;

  @ApiPropertyOptional({ example: 66000000, nullable: true })
  finalPrice: number | null;
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
  sku: string | null;

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
    type: [ProductPriceResponseDto],
    nullable: true,
    example: [
      {
        valueAttributes: [
          {
            id: '01JEX000000000000000000080',
            attributeId: '01JEX000000000000000000070',
            value: '256gb',
            label: '۲۵۶ گیگابایت',
            sortOrder: 0,
            isActive: true,
            createdAt: '2026-09-02T10:00:00.000Z',
            updatedAt: '2026-09-02T10:00:00.000Z',
          },
        ],
        price: 68000000,
        discountPercentage: 10,
        discountAmount: 2000000,
        expireDate: '2026-12-31T23:59:59.000Z',
        maxQuantity: 5,
        minQuantity: 1,
        finalPrice: 66000000,
      },
    ],
  })
  price: ProductPriceResponseDto[];

  @ApiPropertyOptional({
    example: '01JEX000000000000000000030',
    nullable: true,
    description: 'شناسه روش ارسال',
  })
  shippingMethodId: string | null;

  @ApiPropertyOptional({
    type: ShippingMethodResponseDto,
    nullable: true,
    description: 'جزئیات روش ارسال (از روی shippingMethodId)',
  })
  shippingMethod: ShippingMethodResponseDto | null;

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
    type: [AttributeValueResponseDto],
    description:
      'آرایه valueAttributeهای محصول (مقادیر ویژگی) — به‌جای attributeIds',
    example: [
      {
        id: '01JEX000000000000000000080',
        attributeId: '01JEX000000000000000000070',
        value: '256gb',
        label: '۲۵۶ گیگابایت',
        sortOrder: 0,
        isActive: true,
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z',
      },
    ],
  })
  valueAttributes: AttributeValueResponseDto[];

  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000040'],
    description: 'آرایه شناسه فروشنده‌های مرتبط با محصول',
  })
  sellerIds: string[];

  @ApiPropertyOptional({
    nullable: true,
    example: '01JEX000000000000000000040',
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
    type: [AttributeResponseDto],
    example: [{ ...ATTRIBUTE_RESPONSE_EXAMPLE, values: [] }],
    description: 'ویژگی‌های والد با values (valueAttributeها)',
  })
  attributes?: AttributeResponseDto[];

  @ApiPropertyOptional({
    type: SellerResponseDto,
    nullable: true,
    description: 'فروشندهٔ سازنده — populate از createdBySellerId',
  })
  createdBySeller?: SellerResponseDto | null;

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
}

function normalizeImage(image: Product['image']): ProductImageData {
  return {
    featuredImg: image?.featuredImg ?? null,
    gallery: Array.isArray(image?.gallery) ? image.gallery : [],
  };
}

/** دادهٔ قدیمی ممکن است آبجکت تکی باشد — همیشه آرایه برمی‌گردانیم */
function normalizePriceResponse(
  price: Product['price'] | ProductPriceData | null | undefined,
): ProductPriceData[] {
  if (price == null) return [];
  if (Array.isArray(price)) return price;
  return [price];
}

function toPriceResponses(
  price: Product['price'] | ProductPriceData | null | undefined,
  attributeValueById?: Map<string, AttributeValueResponseDto>,
): ProductPriceResponseDto[] {
  return normalizePriceResponse(price).map((item) => ({
    valueAttributes: getPriceValueAttributeIds(item)
      .map((id) => attributeValueById?.get(id))
      .filter((value): value is AttributeValueResponseDto => Boolean(value)),
    price: item.price ?? null,
    discountPercentage: item.discountPercentage ?? null,
    discountAmount: item.discountAmount ?? null,
    expireDate: item.expireDate ?? null,
    maxQuantity: item.maxQuantity ?? null,
    minQuantity: item.minQuantity ?? null,
    finalPrice: item.finalPrice ?? null,
  }));
}

export function toProductResponse(
  product: Product,
  includeRelations = false,
  populated: ProductPopulatedRelations = {},
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
    price: toPriceResponses(product.price, populated.attributeValueById),
    shippingMethodId: product.shippingMethodId ?? null,
    shippingMethod: includeRelations
      ? (populated.shippingMethod ??
        (product.shippingMethod
          ? toShippingMethodResponse(product.shippingMethod)
          : null))
      : null,
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
    valueAttributes: includeRelations ? (populated.valueAttributes ?? []) : [],
    sellerIds: product.sellerIds ?? [],
    createdBySellerId: product.createdBySellerId ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    brand:
      includeRelations && product.brand
        ? toBrandResponse(product.brand)
        : includeRelations
          ? null
          : undefined,
    attributes: includeRelations ? (populated.attributes ?? []) : undefined,
    createdBySeller: includeRelations
      ? (populated.createdBySeller ?? null)
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
  };
}
