import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';
import { BRAND_EXAMPLES } from './brand.examples.js';
import { ProductWritableFieldsDto } from './product-fields.dto.js';

export class CreateProductDto extends ProductWritableFieldsDto {
  @ApiPropertyOptional({
    example: BRAND_EXAMPLES.brandId,
    description: 'شناسه برند از قبل ساخته‌شده — GET /brands',
  })
  @IsOptional()
  @IsUUID('4')
  brandId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
    ],
    description: 'آرایه شناسه فروشنده‌های مرتبط با محصول',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  sellerIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [CATEGORY_EXAMPLES.subCategoryId],
    description:
      'شناسه category یا subCategory — سلسله: parent-categories → categories → sub-categories',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
