import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum PriceAdjustmentScope {
  SINGLE = 'single',
  GROUP = 'group',
}

export enum PriceAdjustmentType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum PriceAdjustmentDirection {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

export enum PriceApplyTarget {
  MIN = 'minPrice',
  MAX = 'maxPrice',
  BOTH = 'both',
}

export class AdjustProductPricesDto {
  @ApiProperty({ enum: PriceAdjustmentScope, example: PriceAdjustmentScope.SINGLE })
  @IsEnum(PriceAdjustmentScope)
  scope: PriceAdjustmentScope;

  @ApiPropertyOptional({
    example: ['SAM-S24U-256', 'APL-IP15P-256'],
    description: 'برای scope=single — لیست SKU',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  skus?: string[];

  @ApiPropertyOptional({ description: 'برای scope=group — فیلتر برند' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ example: 'publish', description: 'برای scope=group' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'برای scope=group — فیلتر نام' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: PriceAdjustmentType, example: PriceAdjustmentType.PERCENTAGE })
  @IsEnum(PriceAdjustmentType)
  adjustmentType: PriceAdjustmentType;

  @ApiProperty({
    enum: PriceAdjustmentDirection,
    example: PriceAdjustmentDirection.INCREASE,
  })
  @IsEnum(PriceAdjustmentDirection)
  direction: PriceAdjustmentDirection;

  @ApiProperty({
    example: 10,
    description: 'درصد (مثلاً 10) یا مبلغ ثابت (مثلاً 500000)',
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({
    enum: PriceApplyTarget,
    default: PriceApplyTarget.BOTH,
  })
  @IsOptional()
  @IsEnum(PriceApplyTarget)
  applyTo?: PriceApplyTarget;
}

export class ProductPriceChangeItemDto {
  @ApiProperty()
  sku: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  oldMinPrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  newMinPrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  oldMaxPrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  newMaxPrice: number | null;
}

export class AdjustProductPricesResponseDto {
  @ApiProperty()
  updatedCount: number;

  @ApiProperty({ type: [String] })
  notFoundSkus: string[];

  @ApiProperty({ type: [ProductPriceChangeItemDto] })
  items: ProductPriceChangeItemDto[];
}

export class ImportProductPricesResponseDto {
  @ApiProperty()
  updatedCount: number;

  @ApiProperty()
  skippedCount: number;

  @ApiProperty({ type: [String] })
  notFoundSkus: string[];

  @ApiProperty({ type: [String] })
  errors: string[];
}
