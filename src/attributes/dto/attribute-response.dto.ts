import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Attribute } from '../entities/attribute.entity.js';
import { AttributeValue } from '../entities/attribute-value.entity.js';
import {
  CREATE_VARIANT_EXAMPLE,
  CREATE_VARIANT_VALUE_EXAMPLE,
  VARIANT_EXAMPLES,
  VARIANT_RESPONSE_EXAMPLE,
  VARIANT_VALUE_RESPONSE_EXAMPLE,
} from './attribute.examples.js';

export class CreateVariantValueNestedDto {
  @ApiProperty({ example: CREATE_VARIANT_VALUE_EXAMPLE.value })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  value: string;

  @ApiProperty({ example: CREATE_VARIANT_VALUE_EXAMPLE.slug })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug: string;
}

export class CreateVariantDto {
  @ApiProperty({ example: CREATE_VARIANT_EXAMPLE.name })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: CREATE_VARIANT_EXAMPLE.label })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: CREATE_VARIANT_EXAMPLE.variantValueIds,
    description: 'اتصال variantValueهای از قبل ساخته‌شده — POST /variant-values',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  variantValueIds?: string[];
}

export class CreateVariantValueForVariantDto extends CreateVariantValueNestedDto {}

export class UpdateVariantDto extends PartialType(
  OmitType(CreateVariantDto, ['variantValueIds'] as const),
) {}

export class CreateVariantValueDto extends CreateVariantValueNestedDto {}

export class UpdateVariantValueDto extends PartialType(CreateVariantValueNestedDto) {
  @ApiPropertyOptional({ example: VARIANT_EXAMPLES.variantId })
  @IsOptional()
  @IsUUID()
  variantId?: string | null;
}

export class ListVariantValuesQueryDto {
  @ApiPropertyOptional({ example: VARIANT_EXAMPLES.variantId })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class VariantResponseDto {
  @ApiProperty({ example: VARIANT_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: VARIANT_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiProperty({ example: VARIANT_RESPONSE_EXAMPLE.label })
  label: string;

  @ApiProperty({ example: VARIANT_RESPONSE_EXAMPLE.isPublic })
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => VariantValueResponseDto,
    isArray: true,
    description: 'مقادیر واریانت — در صورت populate',
  })
  values?: VariantValueResponseDto[];
}

export class VariantValueResponseDto {
  @ApiProperty({ example: VARIANT_VALUE_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiPropertyOptional({
    example: VARIANT_VALUE_RESPONSE_EXAMPLE.variantId,
    nullable: true,
  })
  variantId: string | null;

  @ApiProperty({ example: VARIANT_VALUE_RESPONSE_EXAMPLE.value })
  value: string;

  @ApiProperty({ example: VARIANT_VALUE_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({
    type: () => VariantResponseDto,
    example: VARIANT_RESPONSE_EXAMPLE,
  })
  variant?: VariantResponseDto;
}

/** @deprecated use CreateVariantDto */
export class CreateAttributeDto extends CreateVariantDto {}
/** @deprecated use CreateVariantValueDto */
export class CreateAttributeValueDto extends CreateVariantValueDto {}
/** @deprecated use CreateVariantValueForVariantDto */
export class CreateAttributeValueForAttributeDto extends CreateVariantValueForVariantDto {}
/** @deprecated use UpdateVariantDto */
export class UpdateAttributeDto extends UpdateVariantDto {}
/** @deprecated use UpdateVariantValueDto */
export class UpdateAttributeValueDto extends UpdateVariantValueDto {}
/** @deprecated use ListVariantValuesQueryDto */
export class ListAttributeValuesQueryDto extends ListVariantValuesQueryDto {}
/** @deprecated use VariantResponseDto */
export class AttributeResponseDto extends VariantResponseDto {}
/** @deprecated use VariantValueResponseDto */
export class AttributeValueResponseDto extends VariantValueResponseDto {}
/** @deprecated use CreateVariantValueNestedDto */
export class CreateAttributeValueNestedDto extends CreateVariantValueNestedDto {}

export function toVariantResponse(
  attribute: Attribute,
  includeValues = false,
): VariantResponseDto {
  return {
    id: attribute.id,
    name: attribute.name,
    label: attribute.label,
    isPublic: attribute.isPublic,
    createdAt: attribute.createdAt,
    updatedAt: attribute.updatedAt,
    values:
      includeValues && attribute.values
        ? attribute.values.map((item) => toVariantValueResponse(item))
        : undefined,
  };
}

export function toVariantValueResponse(
  attributeValue: AttributeValue,
  includeVariant = false,
): VariantValueResponseDto {
  return {
    id: attributeValue.id,
    variantId: attributeValue.attributeId,
    value: attributeValue.value,
    slug: attributeValue.slug,
    createdAt: attributeValue.createdAt,
    variant:
      includeVariant && attributeValue.attribute
        ? toVariantResponse(attributeValue.attribute)
        : undefined,
  };
}

/** @deprecated use toVariantResponse */
export const toAttributeResponse = toVariantResponse;
/** @deprecated use toVariantValueResponse */
export const toAttributeValueResponse = toVariantValueResponse;
