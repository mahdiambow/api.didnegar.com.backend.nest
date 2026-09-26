import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsULID } from '../../common/id/index.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import type { ReviewStatus } from '../entities/review.entity.js';

export class CreateReviewDto {
  @ApiProperty({
    format: 'ulid',
    example: '01JEX000000000000000000010',
    description: 'شناسه پیشنهاد فروش (seller offer) — محصول از روی آفر resolve می‌شود',
  })
  @IsULID()
  offerId: string;

  @ApiProperty({
    example: 'کیفیت خوبی داشت، راضی هستم.',
    minLength: 3,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    type: String,
    format: 'ulid',
    nullable: true,
    example: '01JEX000000000000000000080',
    description:
      'شناسه نظر والد برای پاسخ (reply) — برای کامنت ریشه نفرستید یا null بگذارید',
  })
  @IsOptional()
  @IsULID()
  parentId?: string | null;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 5,
    description:
      'برای کامنت ریشه: اگر کاربر محصول را خریده باشد الزامی است؛ وگرنه اختیاری. برای reply ممنوع.',
  })
  @ValidateIf((dto: CreateReviewDto) => !dto.parentId)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number | null;
}

export class ListReviewsQueryDto extends PaginationQueryDto {
  @ApiProperty({ format: 'ulid' })
  @IsULID()
  productId: string;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ['approved', 'pending', 'spam'] })
  @IsIn(['approved', 'pending', 'spam'])
  status: ReviewStatus;
}

export class ReviewAuthorDto {
  @ApiPropertyOptional({ nullable: true, format: 'ulid' })
  id: string | null;

  @ApiPropertyOptional({ nullable: true })
  displayName: string | null;
}

export class ReviewResponseDto {
  @ApiProperty({ format: 'ulid' })
  id: string;

  @ApiProperty({ format: 'ulid' })
  productId: string;

  @ApiPropertyOptional({ nullable: true, format: 'ulid' })
  offerId: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'ulid' })
  parentId: string | null;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional({ nullable: true, example: 5 })
  rating: number | null;

  @ApiProperty({ enum: ['approved', 'pending', 'spam'] })
  status: ReviewStatus;

  @ApiProperty({ type: ReviewAuthorDto })
  author: ReviewAuthorDto;

  @ApiProperty({ type: [ReviewResponseDto] })
  @Type(() => ReviewResponseDto)
  replies: ReviewResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toReviewResponse(
  review: {
    id: string;
    productId: string;
    offerId?: string | null;
    parentId: string | null;
    content: string;
    rating: number | null;
    status: ReviewStatus;
    userId: string | null;
    authorName: string | null;
    user?: {
      id: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
      username: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  },
  replies: ReviewResponseDto[] = [],
): ReviewResponseDto {
  const user = review.user;
  const displayName =
    user?.displayName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    review.authorName ||
    null;

  return {
    id: review.id,
    productId: review.productId,
    offerId: review.offerId ?? null,
    parentId: review.parentId,
    content: review.content,
    rating: review.rating,
    status: review.status,
    author: {
      id: review.userId ?? user?.id ?? null,
      displayName,
    },
    replies,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
