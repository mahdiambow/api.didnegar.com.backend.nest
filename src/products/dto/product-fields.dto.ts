import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateBy,
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

/** فیلدهای قابل نوشتن جدول `products` (مطابق schema) */
export class ProductWritableFieldsDto {
  @ApiProperty({ example: 'گوشی Galaxy S24' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

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
    example: { color: ['قرمز', 'مشکی'], storage: ['256GB', '512GB'] },
    description:
      'ویژگی‌های مجاز محصول؛ فروشنده فقط از همین مقادیر می‌تواند قیمت‌گذاری کند',
    additionalProperties: { type: 'array', items: { type: 'string' } },
  })
  @IsOptional()
  @ValidateBy({
    name: 'productAttributes',
    validator: {
      validate: isProductAttributesSchema,
      defaultMessage: () =>
        'attributes must be an object of non-empty unique string arrays (max 20 keys, 50 values each)',
    },
  })
  attributes?: Record<string, string[]>;
}

export type ProductWritableData = Omit<
  ProductWritableFieldsDto,
  'name' | 'slug'
> & {
  name: string;
  slug: string;
  brandId?: string | null;
  attributes?: Record<string, string[]>;
  sellerIds?: string[];
};

export function toProductEntityData(
  dto: ProductWritableData,
  legacyId: number,
): Record<string, unknown> {
  const sellerIds = [...new Set(dto.sellerIds ?? [])];
  return {
    legacyId,
    legacyTable: 'products',
    name: dto.name,
    slug: dto.slug,
    description: dto.description ?? null,
    shortDescription: dto.shortDescription ?? null,
    status: dto.status ?? 'publish',
    approvalStatus: 'pending',
    rejectionReason: null,
    brandId: dto.brandId ?? null,
    isVirtual: dto.isVirtual ?? false,
    isDownloadable: dto.isDownloadable ?? false,
    taxStatus: dto.taxStatus ?? null,
    taxClass: dto.taxClass ?? null,
    weight: dto.weight ?? null,
    length: dto.length ?? null,
    width: dto.width ?? null,
    height: dto.height ?? null,
    attributes: dto.attributes ?? {},
    sellerIds,
    createdBySellerId: sellerIds[0] ?? null,
  };
}
