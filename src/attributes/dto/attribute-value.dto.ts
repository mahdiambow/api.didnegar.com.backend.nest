import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { AttributeValue } from '../entities/attribute-value.entity.js';

export class ListAttributeValuesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000070',
    description: 'فیلتر بر اساس ویژگی والد',
  })
  @IsOptional()
  @IsULID()
  attributeId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAttributeValueDto {
  @ApiProperty({
    example: '01JEX000000000000000000070',
    description: 'شناسه ULID ویژگی والد — GET /attributes',
  })
  @IsULID()
  attributeId: string;

  @ApiProperty({ example: '256gb' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  value: string;

  @ApiProperty({ example: '۲۵۶ گیگابایت' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAttributeValueDto extends PartialType(
  CreateAttributeValueDto,
) {}

export class AttributeValueResponseDto {
  @ApiProperty({
    example: '01JEX000000000000000000080',
    description: 'شناسه ULID مقدار (valueId)',
  })
  id: string;

  @ApiProperty({ example: '01JEX000000000000000000070' })
  attributeId: string;

  @ApiProperty({ example: '256gb' })
  value: string;

  @ApiProperty({ example: '۲۵۶ گیگابایت' })
  label: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toAttributeValueResponse(
  value: AttributeValue,
): AttributeValueResponseDto {
  return {
    id: value.id,
    attributeId: value.attributeId,
    value: value.value,
    label: value.label,
    sortOrder: value.sortOrder,
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
