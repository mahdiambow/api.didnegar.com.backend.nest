import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import {
  DISCOUNT_TYPES,
  type DiscountType,
  type Promotion,
} from '../entities/promotion.entity.js';

export class CreatePromotionDto {
  @ApiProperty({ example: 'تخفیف نوروز' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: '۲۰٪ تخفیف تا سقف ۵۰۰ هزار تومان' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 'NOWROOZ20',
    description: 'کد کوپن — یکتا؛ خالی = پروموشن بدون کد',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string | null;

  @ApiProperty({ enum: DISCOUNT_TYPES, example: 'PERCENTAGE' })
  @IsIn([...DISCOUNT_TYPES])
  discountType: DiscountType;

  @ApiProperty({ example: 20, description: 'مقدار تخفیف (٪ یا مبلغ ثابت)' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({
    example: 50000000,
    description: 'قیمت نهایی ثابت بعد از تخفیف (اختیاری)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountPrice?: number | null;

  @ApiPropertyOptional({ example: '2026-03-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  discountStartAt?: string | null;

  @ApiPropertyOptional({ example: '2026-04-05T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  discountEndAt?: string | null;

  @ApiPropertyOptional({ example: 1000000, description: 'حداقل مبلغ سفارش' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minOrderAmount?: number | null;

  @ApiPropertyOptional({
    example: 500000,
    description: 'سقف مبلغ تخفیف در هر بار اعمال',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1000, description: 'سقف کل استفاده در سیستم' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'تا چند بار هر یوزر می‌تواند استفاده کند',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number | null;

  @ApiPropertyOptional({
    example: 1000000,
    description: 'سقف مجموع مبلغ تخفیف هر یوزر از این پروموشن',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  maxDiscountAmountPerUser?: number | null;
}

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}

export class ListPromotionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'NOWROOZ' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ enum: DISCOUNT_TYPES })
  @IsOptional()
  @IsIn([...DISCOUNT_TYPES])
  discountType?: DiscountType;
}

export class PreviewPromotionDto {
  @ApiProperty({ example: 'NOWROOZ20' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;

  @ApiProperty({
    example: 68000000,
    description: 'مبلغ پایه سفارش (معمولاً subtotal + shipping)',
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  orderAmount: number;
}

export class PromotionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;

  @ApiProperty({ enum: DISCOUNT_TYPES })
  discountType: DiscountType;

  @ApiProperty()
  discountValue: number;

  @ApiPropertyOptional({ nullable: true })
  discountPrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  discountStartAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  discountEndAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  minOrderAmount: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxDiscountAmount: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  usageLimit: number | null;

  @ApiProperty()
  usedCount: number;

  @ApiPropertyOptional({ nullable: true })
  usageLimitPerUser: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxDiscountAmountPerUser: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PromotionPreviewResponseDto {
  @ApiProperty()
  promotionId: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;

  @ApiProperty()
  orderAmount: number;

  @ApiProperty({ description: 'مبلغ تخفیف قابل اعمال' })
  discountAmount: number;

  @ApiProperty({ description: 'قیمت نهایی بعد از تخفیف' })
  discountPrice: number;

  @ApiProperty({ enum: DISCOUNT_TYPES })
  discountType: DiscountType;

  @ApiProperty()
  discountValue: number;
}

export function toPromotionResponse(p: Promotion): PromotionResponseDto {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    code: p.code,
    discountType: p.discountType,
    discountValue: Number(p.discountValue),
    discountPrice:
      p.discountPrice == null ? null : Number(p.discountPrice),
    discountStartAt: p.discountStartAt,
    discountEndAt: p.discountEndAt,
    minOrderAmount:
      p.minOrderAmount == null ? null : Number(p.minOrderAmount),
    maxDiscountAmount:
      p.maxDiscountAmount == null ? null : Number(p.maxDiscountAmount),
    isActive: p.isActive,
    usageLimit: p.usageLimit,
    usedCount: p.usedCount,
    usageLimitPerUser: p.usageLimitPerUser,
    maxDiscountAmountPerUser:
      p.maxDiscountAmountPerUser == null
        ? null
        : Number(p.maxDiscountAmountPerUser),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
