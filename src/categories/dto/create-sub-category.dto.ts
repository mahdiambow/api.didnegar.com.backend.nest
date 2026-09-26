import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { CATEGORY_EXAMPLES } from './category.examples.js';

export class CreateSubCategoryDto {
  @ApiProperty({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'شناسه دسته والد',
  })
  @IsULID()
  categoryId: string;

  @ApiProperty({
    example: 'گوشی',
    description: 'نام فارسی زیردسته',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Phones',
    description: 'عنوان انگلیسی زیردسته',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @ApiProperty({
    example: 'phones',
    description: 'slug یکتا در scope همان دسته',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones-icon.svg',
    description: 'URL آیکون',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones.jpg',
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

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'دسته ویژه — اگر true باشد specialImage برمی‌گردد',
  })
  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones-special.jpg',
    description: 'URL تصویر ویژه (وقتی isSpecial=true)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  specialImage?: string | null;
}

export class UpdateSubCategoryDto {
  @ApiPropertyOptional({ example: 'گوشی هوشمند' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Smartphones' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string | null;

  @ApiPropertyOptional({ example: 'smartphones' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones-icon.svg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones.jpg',
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

  @ApiPropertyOptional({
    example: false,
    description: 'دسته ویژه — اگر true باشد specialImage برمی‌گردد',
  })
  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones-special.jpg',
    description: 'URL تصویر ویژه',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  specialImage?: string | null;
}
