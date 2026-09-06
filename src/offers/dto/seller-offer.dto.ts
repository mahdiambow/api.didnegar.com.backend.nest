import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ValidateIf,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateSellerOfferDto {
  @ApiProperty() @IsUUID() sellerId: string;
  @ApiProperty() @IsUUID() variantId: string;
  @ApiProperty({ example: 'SAM-S24U-256-BLU' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;
  @ApiProperty({ example: 68000000 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999999999999)
  price: number;
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stockQuantity: number;
  @ApiProperty({ enum: ['instock', 'outofstock', 'onbackorder'] })
  @IsIn(['instock', 'outofstock', 'onbackorder'])
  stockStatus: string;
  @ApiPropertyOptional({ default: false })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isOnSale?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxStatus?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxClass?: string | null;
  @ApiPropertyOptional({ default: true })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateSellerOfferDto extends PartialType(
  OmitType(CreateSellerOfferDto, ['sellerId', 'variantId'] as const),
  { skipNullProperties: false },
) {}
export class ListSellerOffersDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() sellerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
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
export class SellerOfferResponseDto extends CreateSellerOfferDto {
  @ApiProperty({ format: 'uuid', description: 'شناسه پیشنهاد فروش' })
  offerId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
