import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';

/** فیلترهای کاتالوگ پابلیک — فقط محصولات publish + approved + active */
export class ListPublicProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  brandId?: string;

  @ApiPropertyOptional({
    example: 'canon',
    description: 'جستجو در name / subtitle / slug / sku / shortDescription',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 'گوشی' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر بر اساس دسته اصلی',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'فیلتر بر اساس زیردسته',
  })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;
}
