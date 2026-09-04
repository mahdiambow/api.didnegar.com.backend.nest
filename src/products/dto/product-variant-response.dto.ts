import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { ProductVariantAttribute } from '../entities/product-variant-attribute.entity.js';
import {
  VariantValueResponseDto,
  toVariantValueResponse,
} from '../../attributes/dto/attribute-response.dto.js';
import {
  CREATE_PRODUCT_ATTRIBUTE_EXAMPLE,
  PRODUCT_ATTRIBUTE_EXAMPLES,
  PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE,
} from './product-variant.examples.js';

export class CreateProductAttributeDto {
  @ApiProperty({
    example: PRODUCT_ATTRIBUTE_EXAMPLES.productId,
    description: 'شناسه محصول والد',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: CREATE_PRODUCT_ATTRIBUTE_EXAMPLE.sku })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: CREATE_PRODUCT_ATTRIBUTE_EXAMPLE.minPrice })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: CREATE_PRODUCT_ATTRIBUTE_EXAMPLE.maxPrice })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 'instock' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  stockStatus?: string;

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
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'publish', default: 'publish' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

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

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductAttributeDto extends PartialType(
  OmitType(CreateProductAttributeDto, ['productId'] as const),
) {}

export class ListProductAttributesQueryDto {
  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_EXAMPLES.productId })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class CreateProductAttributeVariantDto {
  @ApiProperty({
    example: PRODUCT_ATTRIBUTE_EXAMPLES.attributeId,
    description: 'شناسه attribute محصول',
  })
  @IsUUID()
  attributeId: string;

  @ApiProperty({
    example: PRODUCT_ATTRIBUTE_EXAMPLES.variantValueId,
    description: 'شناسه variantValue — از POST /variant-values',
  })
  @IsUUID()
  variantValueId: string;
}

export class ListProductAttributeVariantsQueryDto {
  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_EXAMPLES.attributeId })
  @IsOptional()
  @IsUUID()
  attributeId?: string;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_EXAMPLES.variantValueId })
  @IsOptional()
  @IsUUID()
  variantValueId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class ProductAttributeVariantResponseDto {
  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.variants[0].id })
  id: string;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_EXAMPLES.attributeId })
  attributeId: string;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_EXAMPLES.variantValueId })
  variantValueId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({
    type: VariantValueResponseDto,
  })
  variantValue?: VariantValueResponseDto;
}

export class ProductAttributeResponseDto {
  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.productId })
  productId: string;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.sku })
  sku: string | null;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.minPrice })
  minPrice: number | null;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.maxPrice })
  maxPrice: number | null;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.isVirtual })
  isVirtual: boolean;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.isDownloadable })
  isDownloadable: boolean;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.stockQuantity })
  stockQuantity: number | null;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.stockStatus })
  stockStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxClass: string | null;

  @ApiPropertyOptional({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.description })
  description: string | null;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.status })
  status: string;

  @ApiPropertyOptional({ nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ nullable: true })
  length: number | null;

  @ApiPropertyOptional({ nullable: true })
  width: number | null;

  @ApiPropertyOptional({ nullable: true })
  height: number | null;

  @ApiProperty({ example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.isActive })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [ProductAttributeVariantResponseDto],
    example: PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE.variants,
  })
  variants?: ProductAttributeVariantResponseDto[];
}

/** @deprecated use CreateProductAttributeDto */
export class CreateProductVariantDto extends CreateProductAttributeDto {}
/** @deprecated use UpdateProductAttributeDto */
export class UpdateProductVariantDto extends UpdateProductAttributeDto {}
/** @deprecated use ListProductAttributesQueryDto */
export class ListProductVariantsQueryDto extends ListProductAttributesQueryDto {}
/** @deprecated use CreateProductAttributeVariantDto */
export class CreateProductVariantAttributeDto extends CreateProductAttributeVariantDto {}
/** @deprecated use ListProductAttributeVariantsQueryDto */
export class ListProductVariantAttributesQueryDto extends ListProductAttributeVariantsQueryDto {}
/** @deprecated use ProductAttributeVariantResponseDto */
export class ProductVariantAttributeResponseDto extends ProductAttributeVariantResponseDto {}
/** @deprecated use ProductAttributeResponseDto */
export class ProductVariantResponseDto extends ProductAttributeResponseDto {}

export function toProductAttributeVariantResponse(
  link: ProductVariantAttribute,
): ProductAttributeVariantResponseDto {
  return {
    id: link.id,
    attributeId: link.variantId,
    variantValueId: link.attributeValueId,
    createdAt: link.createdAt,
    variantValue: link.attributeValue
      ? toVariantValueResponse(link.attributeValue, true)
      : undefined,
  };
}

export function toProductAttributeResponse(
  variant: ProductVariant,
  includeVariants = false,
): ProductAttributeResponseDto {
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    minPrice: variant.minPrice !== null ? Number(variant.minPrice) : null,
    maxPrice: variant.maxPrice !== null ? Number(variant.maxPrice) : null,
    isVirtual: variant.isVirtual,
    isDownloadable: variant.isDownloadable,
    stockQuantity: variant.stockQuantity,
    stockStatus: variant.stockStatus,
    taxStatus: variant.taxStatus,
    taxClass: variant.taxClass,
    description: variant.description,
    status: variant.status,
    weight: variant.weight !== null ? Number(variant.weight) : null,
    length: variant.length !== null ? Number(variant.length) : null,
    width: variant.width !== null ? Number(variant.width) : null,
    height: variant.height !== null ? Number(variant.height) : null,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    variants:
      includeVariants && variant.variantAttributes
        ? variant.variantAttributes.map(toProductAttributeVariantResponse)
        : undefined,
  };
}

/** @deprecated use toProductAttributeVariantResponse */
export const toProductVariantAttributeResponse = toProductAttributeVariantResponse;
/** @deprecated use toProductAttributeResponse */
export const toProductVariantResponse = toProductAttributeResponse;
