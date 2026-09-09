import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export function isProductAttributesSchema(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 20) return false;
  return entries.every(([key, values]) => {
    if (
      key.trim() !== key ||
      key.length === 0 ||
      key.length > 100 ||
      ['__proto__', 'constructor', 'prototype'].includes(key)
    ) {
      return false;
    }
    if (!Array.isArray(values) || values.length === 0 || values.length > 50) {
      return false;
    }
    const seen = new Set<string>();
    for (const item of values) {
      if (
        typeof item !== 'string' ||
        item.trim() !== item ||
        item.length === 0 ||
        item.length > 200 ||
        seen.has(item)
      ) {
        return false;
      }
      seen.add(item);
    }
    return true;
  });
}

export class ProductKeyValDto {
  @ApiProperty({ example: 'title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  key: string;

  @ApiProperty({ example: 'Galaxy S24 Ultra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  val: string;
}

export class ProductImageDto {
  @ApiPropertyOptional({
    example: 'https://cdn.example.com/products/s24-featured.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  featuredImg?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://cdn.example.com/products/s24-1.jpg',
      'https://cdn.example.com/products/s24-2.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  gallery?: string[];
}

export class ProductPriceDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440060'],
    description: 'شناسه ویژگی‌ها / Attribute IDs',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  attributeIds?: string[];

  @ApiPropertyOptional({ example: 68000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ example: 10, description: 'درصد تخفیف' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage?: number | null;

  @ApiPropertyOptional({ example: 2000000, description: 'مبلغ تخفیف' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountAmount?: number | null;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'تاریخ انقضای تخفیف — ISO',
  })
  @IsOptional()
  @IsDateString()
  expireDate?: string | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  maxQuantity?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  minQuantity?: number | null;

  @ApiPropertyOptional({ example: 66000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  finalPrice?: number | null;
}

export class ProductTableInfoDto {
  @ApiProperty({ example: 'مشخصات فنی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    type: [ProductKeyValDto],
    example: [
      { key: 'پردازنده', val: 'Snapdragon 8 Gen 3' },
      { key: 'رم', val: '12GB' },
    ],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductKeyValDto)
  items: ProductKeyValDto[];
}

export class ProductShippingMethodDto {
  @ApiProperty({ example: 'tipax-cod' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط می‌تواند شامل حروف کوچک، عدد و - باشد',
  })
  slug: string;

  @ApiProperty({ example: 'تیپاکس (پس کرایه)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isCod?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/** فیلدهای قابل نوشتن جدول `products` (مطابق schema) */
export class ProductWritableFieldsDto {
  @ApiProperty({ example: 'گوشی Galaxy S24' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'پرچمدار سامسونگ ۲۰۲۴' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string | null;

  @ApiPropertyOptional({
    example: 'خلاصه کوتاه محصول برای لیست‌ها',
    description: 'خلاصه / excerpt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  excerpt?: string | null;

  @ApiProperty({ example: 'galaxy-s24' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط می‌تواند شامل حروف کوچک، عدد و - باشد',
  })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'SAM-S24U-256' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string | null;

  @ApiPropertyOptional({ example: 'publish', default: 'publish' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: 10,
    default: 0,
    description: 'موجودی محصول — در جدول جداگانه product_stocks ذخیره می‌شود',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock?: number;

  @ApiPropertyOptional({
    type: [ProductKeyValDto],
    example: [
      { key: 'meta_title', val: 'خرید Galaxy S24' },
      { key: 'meta_description', val: 'بهترین قیمت...' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductKeyValDto)
  seo?: ProductKeyValDto[];

  @ApiPropertyOptional({ type: ProductImageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductImageDto)
  image?: ProductImageDto;

  @ApiPropertyOptional({ type: ProductPriceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPriceDto)
  price?: ProductPriceDto | null;

  @ApiPropertyOptional({
    type: ProductShippingMethodDto,
    example: {
      slug: 'tipax-cod',
      name: 'تیپاکس (پس کرایه)',
      price: 75000,
      isCod: true,
      isActive: true,
      sortOrder: 0,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductShippingMethodDto)
  shippingMethod?: ProductShippingMethodDto | null;

  @ApiPropertyOptional({
    type: [ProductTableInfoDto],
    example: [
      {
        name: 'مشخصات فنی',
        items: [{ key: 'وزن', val: '۲۳۳ گرم' }],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductTableInfoDto)
  tableInfo?: ProductTableInfoDto[];

  @ApiPropertyOptional({ example: 'taxable' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxClass?: string;

  @ApiPropertyOptional({ example: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440060'],
    description: 'شناسه ویژگی‌ها (Attribute IDs) — از GET /attributes',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  attributeIds?: string[];

  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected'],
    example: 'approved',
    description: 'وضعیت تأیید محصول',
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  approvalStatus?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({
    example: 'تصاویر محصول ناقص است',
    description: 'دلیل رد — وقتی approvalStatus=rejected',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}

export type ProductWritableData = Omit<
  ProductWritableFieldsDto,
  'name' | 'slug'
> & {
  name: string;
  slug: string;
  brandId?: string | null;
  attributeIds?: string[];
  sellerIds?: string[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
};

function normalizeShippingMethod(
  method: ProductShippingMethodDto | null | undefined,
): Record<string, unknown> | null {
  if (method === undefined) return undefined as unknown as null;
  if (method === null) return null;
  return {
    slug: method.slug,
    name: method.name,
    price: method.price,
    isCod: method.isCod ?? true,
    isActive: method.isActive ?? true,
    sortOrder: method.sortOrder ?? 0,
  };
}

function normalizePrice(
  price: ProductPriceDto | null | undefined,
): Record<string, unknown> | null {
  if (price === undefined) return undefined as unknown as null;
  if (price === null) return null;
  return {
    attributeIds: [...new Set(price.attributeIds ?? [])],
    price: price.price ?? null,
    discountPercentage: price.discountPercentage ?? null,
    discountAmount: price.discountAmount ?? null,
    expireDate: price.expireDate ?? null,
    maxQuantity: price.maxQuantity ?? null,
    minQuantity: price.minQuantity ?? null,
    finalPrice: price.finalPrice ?? null,
  };
}

export function resolveProductStock(
  dto: Pick<ProductWritableData, 'stock'>,
): number {
  return dto.stock ?? 0;
}

export function toProductEntityData(
  dto: ProductWritableData,
  legacyId: number,
): Record<string, unknown> {
  const sellerIds = [...new Set(dto.sellerIds ?? [])];
  const approvalStatus = dto.approvalStatus ?? 'pending';
  const price = normalizePrice(dto.price);
  const shippingMethod = normalizeShippingMethod(dto.shippingMethod);

  return {
    legacyId,
    legacyTable: 'products',
    name: dto.name,
    subtitle: dto.subtitle ?? null,
    excerpt: dto.excerpt ?? null,
    slug: dto.slug,
    description: dto.description ?? null,
    shortDescription: dto.shortDescription ?? null,
    sku: dto.sku ?? null,
    status: dto.status ?? 'publish',
    approvalStatus,
    rejectionReason:
      approvalStatus === 'rejected' ? (dto.rejectionReason ?? null) : null,
    brandId: dto.brandId ?? null,
    isVirtual: dto.isVirtual ?? false,
    isDownloadable: dto.isDownloadable ?? false,
    isActive: dto.isActive ?? true,
    isFeatured: dto.isFeatured ?? false,
    seo: dto.seo ?? [],
    image: {
      featuredImg: dto.image?.featuredImg ?? null,
      gallery: dto.image?.gallery ?? [],
    },
    price: price === undefined ? null : price,
    shippingMethod: shippingMethod === undefined ? null : shippingMethod,
    tableInfo: dto.tableInfo ?? [],
    taxStatus: dto.taxStatus ?? null,
    taxClass: dto.taxClass ?? null,
    weight: dto.weight ?? null,
    length: dto.length ?? null,
    width: dto.width ?? null,
    height: dto.height ?? null,
    attributeIds: [...new Set(dto.attributeIds ?? [])],
    sellerIds,
    createdBySellerId: sellerIds[0] ?? null,
  };
}
