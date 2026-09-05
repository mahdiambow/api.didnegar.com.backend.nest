import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
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
  @IsUUID()
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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class BannerResponseDto extends CreateBannerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
