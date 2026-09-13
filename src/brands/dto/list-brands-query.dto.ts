import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListBrandsQueryDto extends PaginationQueryDto {
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
