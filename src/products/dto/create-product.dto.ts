import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';
import { BRAND_EXAMPLES } from './brand.examples.js';
import { ProductWritableFieldsDto } from './product-fields.dto.js';
import { PRODUCT_ATTRIBUTE_EXAMPLES } from './product-variant.examples.js';

export class CreateProductDto extends ProductWritableFieldsDto {
  @ApiPropertyOptional({
    example: BRAND_EXAMPLES.brandId,
    description: 'شناسه برند از قبل ساخته‌شده — GET /products/brands',
  })
  @IsOptional()
  @IsUUID('4')
  brandId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [CATEGORY_EXAMPLES.subCategoryId],
    description: 'شناسه category یا subCategory — POST /categories یا /sub-categories',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [PRODUCT_ATTRIBUTE_EXAMPLES.attributeId],
    description:
      'شناسه product-attributeهای از قبل ساخته‌شده (POST /product-attributes)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  variantIds?: string[];
}
