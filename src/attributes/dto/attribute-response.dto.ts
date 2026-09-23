import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Attribute } from '../entities/attribute.entity.js';
import {
  CREATE_ATTRIBUTE_EXAMPLE,
  ATTRIBUTE_RESPONSE_EXAMPLE,
} from './attribute.examples.js';
import {
  AttributeValueResponseDto,
  toAttributeValueResponse,
} from './attribute-value.dto.js';

export class ListAttributesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000080',
    description: 'فیلتر ویژگی والد بر اساس valueId',
  })
  @IsOptional()
  @IsULID()
  valueId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'اگر true باشد، همهٔ values هر ویژگی هم برمی‌گردد',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  includeValues?: boolean = false;
}

export class CreateAttributeDto {
  @ApiProperty({ example: CREATE_ATTRIBUTE_EXAMPLE.name })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: CREATE_ATTRIBUTE_EXAMPLE.label })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}

export class AttributeResponseDto {
  @ApiProperty({ example: ATTRIBUTE_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: ATTRIBUTE_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiProperty({ example: ATTRIBUTE_RESPONSE_EXAMPLE.label })
  label: string;

  @ApiProperty({ example: ATTRIBUTE_RESPONSE_EXAMPLE.isPublic })
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [AttributeValueResponseDto],
    description: 'مقادیر این ویژگی (valueId = id هر آیتم)',
  })
  values?: AttributeValueResponseDto[];
}

export function toAttributeResponse(
  attribute: Attribute,
  includeValues = false,
): AttributeResponseDto {
  return {
    id: attribute.id,
    name: attribute.name,
    label: attribute.label,
    isPublic: attribute.isPublic,
    createdAt: attribute.createdAt,
    updatedAt: attribute.updatedAt,
    values: includeValues
      ? (attribute.values ?? []).map(toAttributeValueResponse)
      : undefined,
  };
}
