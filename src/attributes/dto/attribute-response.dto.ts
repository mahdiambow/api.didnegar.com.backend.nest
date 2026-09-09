import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Attribute } from '../entities/attribute.entity.js';
import {
  CREATE_ATTRIBUTE_EXAMPLE,
  ATTRIBUTE_RESPONSE_EXAMPLE,
} from './attribute.examples.js';

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
}

export function toAttributeResponse(attribute: Attribute): AttributeResponseDto {
  return {
    id: attribute.id,
    name: attribute.name,
    label: attribute.label,
    isPublic: attribute.isPublic,
    createdAt: attribute.createdAt,
    updatedAt: attribute.updatedAt,
  };
}
