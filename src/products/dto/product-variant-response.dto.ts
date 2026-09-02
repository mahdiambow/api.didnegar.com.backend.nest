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
import { AttributeValue } from '../entities/attribute-value.entity.js';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { ProductVariantAttribute } from '../entities/product-variant-attribute.entity.js';
import {
  ASSIGN_VARIANT_ATTRIBUTE_EXAMPLE,
  ATTRIBUTE_VALUE_RESPONSE_EXAMPLE,
  CREATE_PRODUCT_VARIANT_EXAMPLE,
  PRODUCT_VARIANT_RESPONSE_EXAMPLE,
  VARIANT_EXAMPLES,
} from './product-variant.examples.js';

export class CreateProductVariantDto {
  @ApiProperty({
    example: VARIANT_EXAMPLES.productId,
    description: 'شناسه محصول والد',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: CREATE_PRODUCT_VARIANT_EXAMPLE.sku })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: CREATE_PRODUCT_VARIANT_EXAMPLE.minPrice })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: CREATE_PRODUCT_VARIANT_EXAMPLE.maxPrice })
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

export class CreateProductVariantNestedDto extends OmitType(
  CreateProductVariantDto,
  ['productId'] as const,
) {}

export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class ListProductVariantsQueryDto {
  @ApiPropertyOptional({ example: VARIANT_EXAMPLES.productId })
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

export class AssignVariantAttributeDto {
  @ApiProperty({
    example: ASSIGN_VARIANT_ATTRIBUTE_EXAMPLE.attributeValueId,
    description: 'شناسه مقدار ویژگی (مثلاً 256GB)',
  })
  @IsUUID()
  attributeValueId: string;
}

export class AttributeValueResponseDto {
  @ApiProperty({ example: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE.value })
  value: string;

  @ApiProperty({ example: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiProperty({ example: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;

  @ApiProperty({ example: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE.updatedAt })
  updatedAt: Date;
}

export class ProductVariantAttributeResponseDto {
  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.attributes[0].id })
  id: string;

  @ApiProperty({ example: VARIANT_EXAMPLES.variantId })
  variantId: string;

  @ApiProperty({ example: VARIANT_EXAMPLES.attributeValueId })
  attributeValueId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({
    type: AttributeValueResponseDto,
    example: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE,
  })
  attributeValue?: AttributeValueResponseDto;
}

export class ProductVariantResponseDto {
  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.productId })
  productId: string;

  @ApiPropertyOptional({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.sku })
  sku: string | null;

  @ApiPropertyOptional({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.minPrice })
  minPrice: number | null;

  @ApiPropertyOptional({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.maxPrice })
  maxPrice: number | null;

  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.isVirtual })
  isVirtual: boolean;

  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.isDownloadable })
  isDownloadable: boolean;

  @ApiPropertyOptional({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.stockQuantity })
  stockQuantity: number | null;

  @ApiPropertyOptional({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.stockStatus })
  stockStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxClass: string | null;

  @ApiPropertyOptional({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.description })
  description: string | null;

  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.status })
  status: string;

  @ApiPropertyOptional({ nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ nullable: true })
  length: number | null;

  @ApiPropertyOptional({ nullable: true })
  width: number | null;

  @ApiPropertyOptional({ nullable: true })
  height: number | null;

  @ApiProperty({ example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.isActive })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [ProductVariantAttributeResponseDto],
    example: PRODUCT_VARIANT_RESPONSE_EXAMPLE.attributes,
  })
  attributes?: ProductVariantAttributeResponseDto[];
}

export function toAttributeValueResponse(
  attributeValue: AttributeValue,
): AttributeValueResponseDto {
  return {
    id: attributeValue.id,
    value: attributeValue.value,
    slug: attributeValue.slug,
    createdAt: attributeValue.createdAt,
    updatedAt: attributeValue.updatedAt,
  };
}

export function toProductVariantAttributeResponse(
  link: ProductVariantAttribute,
): ProductVariantAttributeResponseDto {
  return {
    id: link.id,
    variantId: link.variantId,
    attributeValueId: link.attributeValueId,
    createdAt: link.createdAt,
    attributeValue: link.attributeValue
      ? toAttributeValueResponse(link.attributeValue)
      : undefined,
  };
}

export function toProductVariantResponse(
  variant: ProductVariant,
  includeAttributes = false,
): ProductVariantResponseDto {
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
    attributes:
      includeAttributes && variant.variantAttributes
        ? variant.variantAttributes.map(toProductVariantAttributeResponse)
        : undefined,
  };
}
