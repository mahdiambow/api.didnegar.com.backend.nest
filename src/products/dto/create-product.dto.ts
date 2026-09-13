import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsOptional } from 'class-validator';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';
import { BRAND_EXAMPLES } from './brand.examples.js';
import { ProductWritableFieldsDto } from './product-fields.dto.js';

export class CreateProductDto extends ProductWritableFieldsDto {
  @ApiPropertyOptional({
    example: BRAND_EXAMPLES.brandId,
    description: 'شناسه برند از قبل ساخته‌شده — GET /brands',
  })
  @IsOptional()
  @IsULID()
  brandId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      '01JEX000000000000000000040',
      '01JEX000000000000000000050',
    ],
    description: 'آرایه شناسه فروشنده‌های مرتبط با محصول',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsULID({ each: true })
  sellerIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [CATEGORY_EXAMPLES.subCategoryId],
    description:
      'شناسه category یا subCategory — سلسله: parent-categories → categories → sub-categories',
  })
  @IsOptional()
  @IsArray()
  @IsULID({ each: true })
  categoryIds?: string[];
}
