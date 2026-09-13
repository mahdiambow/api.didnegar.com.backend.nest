import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { UserResponseDto } from '../../auth/dto/user-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { SellerResponseDto } from '../../sellers/dto/seller-response.dto.js';
import {
  MEDIA_GROUPS,
  MEDIA_STATUSES,
  type MediaGroup,
  type MediaStatus,
} from '../entities/media-asset.enums.js';

export class UploadMediaDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'فایل تصویر',
  })
  file: Express.Multer.File;

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

export class ListMediaAssetsDto extends PaginationQueryDto {
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
  @IsULID()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
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
  @ApiProperty({ format: 'ulid' })
  @IsULID()
  productId: string;
}

export class MediaAssetResponseDto {
  @ApiProperty({ format: 'ulid' })
  id: string;

  @ApiProperty({ enum: MEDIA_GROUPS })
  group: MediaGroup;

  @ApiProperty({ format: 'ulid' })
  sellerId: string;

  @ApiProperty({ format: 'ulid' })
  uploadedByUserId: string;

  @ApiPropertyOptional({
    type: SellerResponseDto,
    nullable: true,
    description: 'فروشنده — populate از sellerId',
  })
  seller?: SellerResponseDto | null;

  @ApiPropertyOptional({
    type: UserResponseDto,
    nullable: true,
    description: 'کاربر آپلودکننده — populate از uploadedByUserId',
  })
  uploadedByUser?: UserResponseDto | null;

  @ApiPropertyOptional({ format: 'ulid', nullable: true })
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
