import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  MEDIA_GROUPS,
  MEDIA_STATUSES,
  type MediaGroup,
  type MediaStatus,
} from '../entities/media-asset.enums.js';

export class UploadMediaDto {
  @ApiProperty({
    enum: MEDIA_GROUPS,
    example: 'seller',
    description:
      'گروه سرویس: blog | product | setting | seller | other — مسیر فولدر بر همین اساس است',
  })
  @IsIn(MEDIA_GROUPS)
  group: MediaGroup;

  @ApiPropertyOptional({
    example: 'عکس محصول دوربین کانن',
    description: 'متن جایگزین تصویر (alt)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt?: string;
}

export class ListMediaAssetsDto {
  @ApiPropertyOptional({
    enum: MEDIA_GROUPS,
    description: 'فیلتر بر اساس گروه سرویس',
  })
  @IsOptional()
  @IsIn(MEDIA_GROUPS)
  group?: MediaGroup;

  @ApiPropertyOptional({
    description: 'فقط برای سوپرسلر/ادمین؛ سلر معمولی همیشه خودش فیلتر می‌شود',
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ enum: MEDIA_STATUSES })
  @IsOptional()
  @IsIn(MEDIA_STATUSES)
  status?: MediaStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isUsed?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ReviewMediaAssetDto {
  @ApiProperty({
    enum: ['approved', 'rejected'] as const,
    example: 'approved',
  })
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({
    example: 'کیفیت تصویر پایین است',
    description: 'برای rejected الزامی است',
    nullable: true,
  })
  @ValidateIf((dto: ReviewMediaAssetDto) => dto.status === 'rejected')
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}

export class AttachMediaAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;
}

export class MediaAssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: MEDIA_GROUPS })
  group: MediaGroup;

  @ApiProperty({ format: 'uuid' })
  sellerId: string;

  @ApiProperty({ format: 'uuid' })
  uploadedByUserId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  productId: string | null;

  @ApiProperty()
  originalName: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'عکس محصول دوربین کانن',
    description: 'متن جایگزین تصویر (alt)',
  })
  alt: string | null;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty({ enum: ['staging', 'gallery'] })
  storageLocation: 'staging' | 'gallery';

  @ApiProperty({ enum: MEDIA_STATUSES })
  status: MediaStatus;

  @ApiProperty()
  isUsed: boolean;

  @ApiPropertyOptional({ nullable: true })
  expiresAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;

  @ApiProperty({
    description: 'آدرس عمومی فایل (staging یا gallery)',
    example:
      'http://localhost:3000/media-files/staging/seller/5b05c695-.../8b596745-....jpg',
  })
  url: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
