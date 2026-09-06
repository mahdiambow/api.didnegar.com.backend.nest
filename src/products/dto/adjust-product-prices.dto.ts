import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
export enum PriceAdjustmentType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}
export enum PriceAdjustmentDirection {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}
export class AdjustProductPricesDto {
  @ApiProperty({
    type: [String],
    description: 'شناسه پیشنهادهای فروش برای تغییر قیمت',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  offerIds: string[];
  @ApiProperty({ enum: PriceAdjustmentType })
  @IsEnum(PriceAdjustmentType)
  adjustmentType: PriceAdjustmentType;
  @ApiProperty({ enum: PriceAdjustmentDirection })
  @IsEnum(PriceAdjustmentDirection)
  direction: PriceAdjustmentDirection;
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999999999999)
  value: number;
}
export class ProductPriceChangeItemDto {
  @ApiProperty() offerId: string;
  @ApiProperty() sku: string;
  @ApiProperty() oldPrice: number;
  @ApiProperty() newPrice: number;
}
export class AdjustProductPricesResponseDto {
  @ApiProperty() updatedCount: number;
  @ApiProperty({ type: [ProductPriceChangeItemDto] })
  items: ProductPriceChangeItemDto[];
}
export class ImportProductPricesResponseDto {
  @ApiProperty() updatedCount: number;
}
