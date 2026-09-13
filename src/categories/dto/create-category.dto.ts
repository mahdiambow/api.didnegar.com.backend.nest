import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CATEGORY_EXAMPLES } from './category.examples.js';

export class CreateCategoryDto {
  @ApiProperty({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'شناسه parent category',
  })
  @IsUUID()
  parentCategoryId: string;

  @ApiProperty({
    example: 'موبایل',
    description: 'نام فارسی دسته‌بندی',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Mobile',
    description: 'عنوان انگلیسی دسته‌بندی',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @ApiProperty({
    example: 'mobile',
    description: 'شناسه یکتا — فقط حروف کوچک انگلیسی، عدد و -',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/mobile-icon.svg',
    description: 'URL آیکون',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/mobile.jpg',
    description: 'URL تصویر',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string | null;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'ترتیب نمایش' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sort?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'شناسه parent category',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiPropertyOptional({ example: 'موبایل و تبلت' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Mobile & Tablet' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string | null;

  @ApiPropertyOptional({ example: 'mobile-tablet' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/mobile-icon.svg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/mobile.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'ترتیب نمایش' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sort?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
