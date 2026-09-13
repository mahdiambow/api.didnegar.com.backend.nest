import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../../common/dto/pagination-query.dto.js';
import { BannerPage, BannerSection } from '../types/banner.enums.js';

export class BannerItemDto {
  @ApiProperty({
    example: 'https://example.com/banner.jpg',
    description: 'آدرس تصویر؛ در بخش video آدرس ویدیو',
  })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  mediaUrl: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/products',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  linkUrl?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'پیشنهاد ویژه',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string | null;
}

export class CreateBannerDto {
  @ApiProperty({ enum: BannerPage })
  @IsEnum(BannerPage)
  page: BannerPage;

  @ApiProperty({ enum: BannerSection })
  @IsEnum(BannerSection)
  section: BannerSection;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'شناسه دسته‌بندی برای سایدبار؛ صفحه نخست بدون دسته‌بندی است',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string | null;

  @ApiProperty({
    type: [BannerItemDto],
    description:
      'ترتیب آرایه ترتیب نمایش است؛ عکس سه‌تایی: ۳، دوتایی: ۲، اسلایدر: ۱ تا ۵۰، سایر بخش‌ها: ۱ آیتم',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BannerItemDto)
  items: BannerItemDto[];
}

export class UpdateBannerDto extends PartialType(CreateBannerDto, {
  skipNullProperties: false,
}) {}

export class ListBannersQueryDto {
  @ApiPropertyOptional({ enum: BannerPage })
  @IsOptional()
  @IsEnum(BannerPage)
  page?: BannerPage;

  @ApiPropertyOptional({ enum: BannerSection })
  @IsOptional()
  @IsEnum(BannerSection)
  section?: BannerSection;

  @ApiPropertyOptional({ format: 'ulid' })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    default: DEFAULT_PAGE,
    example: DEFAULT_PAGE,
    description: 'شماره صفحه (پیش‌فرض ۱) — page برای فیلتر صفحه بنر است',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return DEFAULT_PAGE;
    const n = Number(value);
    return Number.isFinite(n) ? n : DEFAULT_PAGE;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: DEFAULT_LIMIT,
    example: DEFAULT_LIMIT,
    maximum: MAX_LIMIT,
    description: 'تعداد در هر صفحه (پیش‌فرض ۲۰، حداکثر ۱۰۰)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return DEFAULT_LIMIT;
    const n = Number(value);
    return Number.isFinite(n) ? n : DEFAULT_LIMIT;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit: number = DEFAULT_LIMIT;
}

export class BannerResponseDto extends CreateBannerDto {
  @ApiProperty({ format: 'ulid' })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
