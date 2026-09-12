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
import { MEDIA_STATUSES, type MediaStatus } from '../entities/media-asset.enums.js';

export class ListMediaAssetsDto {
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

  @ApiProperty({ format: 'uuid' })
  sellerId: string;

  @ApiProperty({ format: 'uuid' })
  uploadedByUserId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  productId: string | null;

  @ApiProperty()
  originalName: string;

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
      'http://localhost:3000/media-files/staging/5b05c695-b30f-43ff-9522-637a5574f7c8/8b596745-761a-477a-bbe8-2e9dd9a440f1.jpg',
  })
  url: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
