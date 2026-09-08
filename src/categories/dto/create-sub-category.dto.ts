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

export class CreateSubCategoryDto {
  @ApiProperty({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'شناسه دسته والد',
  })
  @IsUUID()
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
