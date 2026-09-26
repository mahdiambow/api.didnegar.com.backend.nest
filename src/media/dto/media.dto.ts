import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { UserResponseDto } from '../../utils/auth/dto/user-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { SellerResponseDto } from '../../sellers/dto/seller-response.dto.js';
import {
  MEDIA_GROUPS,
  MEDIA_SCOPES,
  MEDIA_STATUSES,
  type MediaGroup,
  type MediaScope,
  type MediaStatus,
} from '../entities/media-asset.enums.js';

/** First step of the browser → SeaweedFS direct-upload flow. */
export class RequestMediaUploadUrlDto {
  @ApiProperty({ enum: ['product', 'banner'] as const })
  @IsIn(['product', 'banner'])
  scope: Extract<MediaScope, 'product' | 'banner'>;

  @ApiProperty({ example: 'iphone-front.webp', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ example: 'image/webp', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({ example: 284120, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  sizeBytes: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt?: string;
}

export class DirectUploadUrlResponseDto {
  @ApiProperty({ format: 'ulid' })
  mediaId: string;

  @ApiProperty({ description: 'Short-lived URL. Upload with HTTP PUT.' })
  uploadUrl: string;

  @ApiProperty({ example: 300 })
  expiresIn: number;

  @ApiProperty({ example: 'products/01seller/gallery/01media.webp' })
  objectKey: string;
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

  @ApiProperty({ enum: MEDIA_SCOPES })
  scope: MediaScope;

  @ApiProperty({ format: 'ulid' })
  sellerId: string | null;

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
