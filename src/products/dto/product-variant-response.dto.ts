import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { IsArray, ArrayUnique, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { ProductVariantAttribute } from '../entities/product-variant-attribute.entity.js';
import {
  VariantValueResponseDto,
  toVariantValueResponse,
} from '../../attributes/dto/attribute-response.dto.js';
import { PRODUCT_ATTRIBUTE_EXAMPLES } from './product-variant.examples.js';

export class CreateProductAttributeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({
    type: [String],
    description: 'ترکیب مقادیر ویژگی؛ برای محصول بدون ویژگی آرایه خالی',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  attributeValueIds: string[];
}

export class UpdateProductAttributeDto extends PartialType(
  OmitType(CreateProductAttributeDto, ['productId'] as const),
  { skipNullProperties: false },
) {}

export class ListProductAttributesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
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
  @ApiProperty({
    example: PRODUCT_ATTRIBUTE_EXAMPLES.productAttributeVariantId,
  })
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
  @ApiProperty()
  id: string;
  @ApiProperty()
  productId: string;
  @ApiProperty({ type: [String] })
  attributeValueIds: string[];
}
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
  _includeVariants = false,
): ProductAttributeResponseDto {
  return {
    id: variant.id,
    productId: variant.productId,
    attributeValueIds: (variant.variantAttributes ?? [])
      .map((link) => link.attributeValueId)
      .sort(),
  };
}
export const toProductVariantAttributeResponse =
  toProductAttributeVariantResponse;
export const toProductVariantResponse = toProductAttributeResponse;
