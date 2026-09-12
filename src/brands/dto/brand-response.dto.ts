import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Brand } from '../entities/brand.entity.js';
import {
  BRAND_RESPONSE_EXAMPLE,
  CREATE_BRAND_EXAMPLE,
} from './brand.examples.js';

export class CreateBrandDto {
  @ApiProperty({
    example: CREATE_BRAND_EXAMPLE.name,
    description: 'نام فارسی برند',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    example: CREATE_BRAND_EXAMPLE.nameEn,
    description: 'نام انگلیسی برند',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string | null;

  @ApiProperty({
    example: CREATE_BRAND_EXAMPLE.slug,
    description: 'شناسه یکتا — حروف کوچک، عدد و -',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional({
    example: CREATE_BRAND_EXAMPLE.logoUrl,
    description: 'URL تصویر لوگو (مثلاً از گالری رسانه)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @ApiPropertyOptional({
    example: CREATE_BRAND_EXAMPLE.seoDescription,
    description: 'توضیحات سئو',
  })
  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBrandDto {
  @ApiPropertyOptional({ example: 'سامسونگ الکترونیکس' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Samsung Electronics', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string | null;

  @ApiPropertyOptional({ example: 'samsung-electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiPropertyOptional({
    example: CREATE_BRAND_EXAMPLE.logoUrl,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @ApiPropertyOptional({
    example: CREATE_BRAND_EXAMPLE.seoDescription,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BrandResponseDto {
  @ApiProperty({ example: BRAND_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({
    example: BRAND_RESPONSE_EXAMPLE.name,
    description: 'نام فارسی',
  })
  name: string;

  @ApiPropertyOptional({
    example: BRAND_RESPONSE_EXAMPLE.nameEn,
    nullable: true,
    description: 'نام انگلیسی',
  })
  nameEn: string | null;

  @ApiProperty({ example: BRAND_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: BRAND_RESPONSE_EXAMPLE.logoUrl,
    nullable: true,
    description: 'URL تصویر لوگو',
  })
  logoUrl: string | null;

  @ApiPropertyOptional({
    example: BRAND_RESPONSE_EXAMPLE.seoDescription,
    nullable: true,
    description: 'توضیحات سئو',
  })
  seoDescription: string | null;

  @ApiProperty({ example: BRAND_RESPONSE_EXAMPLE.isActive })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toBrandResponse(brand: Brand): BrandResponseDto {
  return {
    id: brand.id,
    name: brand.name,
    nameEn: brand.nameEn ?? null,
    slug: brand.slug,
    logoUrl: brand.logoUrl ?? null,
    seoDescription: brand.seoDescription ?? null,
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}
