import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';

export class ListProductsQueryDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ example: 'گوشی' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر بر اساس دسته اصلی',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'فیلتر بر اساس زیردسته — مثلاً گوشی',
  })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;
}
