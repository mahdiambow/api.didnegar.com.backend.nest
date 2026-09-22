import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'publish' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
    description: 'فیلتر وضعیت تأیید',
  })
  @IsOptional()
  @IsString()
  approvalStatus?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;

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
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'فیلتر شاخه والد (سطح ۱)',
  })
  @IsOptional()
  @IsULID()
  parentCategoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر بر اساس دسته اصلی',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'فیلتر بر اساس زیردسته — مثلاً گوشی',
  })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;
}
