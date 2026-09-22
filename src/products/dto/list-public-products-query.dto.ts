import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';
import { BRAND_EXAMPLES } from '../../brands/dto/brand.examples.js';

/** فیلترهای کاتالوگ پابلیک — فقط محصولات publish + approved + active */
export class ListPublicProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: BRAND_EXAMPLES.brandId,
    description: 'فیلتر برند — فقط محصولات این برند',
  })
  @IsOptional()
  @IsULID()
  brandId?: string;

  @ApiPropertyOptional({
    example: 'canon',
    description:
      'جستجوی آزاد در name / subtitle / slug / sku / shortDescription',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    example: 'گوشی',
    description: 'فیلتر نام محصول (LIKE)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر دسته (سطح ۲)',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'فیلتر زیردسته (سطح ۳) — اگر id دسته باشد هم مچ می‌شود',
  })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'فیلتر شاخه والد (سطح ۱) — همه محصولات زیر آن',
  })
  @IsOptional()
  @IsULID()
  parentCategoryId?: string;

  @ApiPropertyOptional({
    example: 1_000_000,
    description: 'حداقل قیمت پیشنهاد فروش فعال/تأییدشده (ریال)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    example: 50_000_000,
    description: 'حداکثر قیمت پیشنهاد فروش فعال/تأییدشده (ریال)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  maxPrice?: number;
}
