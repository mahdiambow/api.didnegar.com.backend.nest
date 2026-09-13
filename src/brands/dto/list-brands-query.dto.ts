import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListBrandsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'شماره صفحه' })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'تعداد در هر صفحه (حداکثر ۱۰۰)' })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: 'سامسونگ',
    description: 'جستجو در نام فارسی، انگلیسی و slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 'سامسونگ', description: 'فیلتر نام فارسی' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Samsung', description: 'فیلتر نام انگلیسی' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'samsung', description: 'فیلتر slug' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ example: true, description: 'فیلتر وضعیت فعال/غیرفعال' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === '1'
      ? true
      : value === 'false' || value === '0'
        ? false
        : value,
  )
  @IsBoolean()
  isActive?: boolean;
}
