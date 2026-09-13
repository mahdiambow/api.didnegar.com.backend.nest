import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { CATEGORY_EXAMPLES } from './category.examples.js';

/** فیلدهای جدول product_categories (بدون productId) */
export class ProductCategoryLinkDto {
  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'دسته اصلی — بدون زیردسته',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'زیردسته — categoryId از روی آن پر می‌شود',
  })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export type ProductCategoryLinkInput = Pick<
  ProductCategoryLinkDto,
  'categoryId' | 'subCategoryId' | 'isPrimary' | 'position'
>;
