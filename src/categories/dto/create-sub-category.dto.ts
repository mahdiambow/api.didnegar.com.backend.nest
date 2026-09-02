import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
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

  @ApiProperty({
    example: 'phones',
    description: 'slug یکتا در scope همان دسته',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;
}

export class UpdateSubCategoryDto {
  @ApiPropertyOptional({ example: 'گوشی هوشمند' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'smartphones' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;
}
