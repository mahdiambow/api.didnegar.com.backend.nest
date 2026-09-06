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
} from 'class-validator';

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
}

export type ProductWritableData = Omit<
  ProductWritableFieldsDto,
  'name' | 'slug'
> & {
  name: string;
  slug: string;
  brandId?: string | null;
};

export function toProductEntityData(
  dto: ProductWritableData,
  legacyId: number,
): Record<string, unknown> {
  return {
    legacyId,
    legacyTable: 'products',
    name: dto.name,
    slug: dto.slug,
    description: dto.description ?? null,
    shortDescription: dto.shortDescription ?? null,
    status: dto.status ?? 'publish',
    brandId: dto.brandId ?? null,
    isVirtual: dto.isVirtual ?? false,
    isDownloadable: dto.isDownloadable ?? false,
    taxStatus: dto.taxStatus ?? null,
    taxClass: dto.taxClass ?? null,
    weight: dto.weight ?? null,
    length: dto.length ?? null,
    width: dto.width ?? null,
    height: dto.height ?? null,
  };
}
