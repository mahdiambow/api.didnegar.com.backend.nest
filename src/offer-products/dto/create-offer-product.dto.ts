import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateBy,
} from 'class-validator';
import { isProductAttributesSchema } from '../../products/dto/product-fields.dto.js';

export class CreateOfferProductDto {
  @ApiProperty()
  @IsUUID()
  sellerId: string;

  @ApiProperty({ example: 'گوشی Galaxy S24' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'galaxy-s24-offer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط می‌تواند شامل حروف کوچک، عدد و - باشد',
  })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  brandId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    example: { color: ['مشکی', 'نقره‌ای'] },
    additionalProperties: { type: 'array', items: { type: 'string' } },
  })
  @IsOptional()
  @ValidateBy({
    name: 'productAttributes',
    validator: {
      validate: isProductAttributesSchema,
      defaultMessage: () =>
        'attributes must be an object of non-empty unique string arrays',
    },
  })
  attributes?: Record<string, string[]>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxClass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiProperty({ example: 'SAM-S24-256-BLK' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ example: 68000000 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999999999999)
  price: number;

  @ApiProperty({ example: 10, default: 0 })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock: number;

  @ApiProperty({ enum: ['instock', 'outofstock', 'onbackorder'] })
  @IsIn(['instock', 'outofstock', 'onbackorder'])
  stockStatus: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;
}
