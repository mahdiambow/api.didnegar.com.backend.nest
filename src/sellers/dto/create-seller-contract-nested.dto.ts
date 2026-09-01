import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSellerContractNestedDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['5a4083a7-9b1a-4c07-8321-e9c5545993f8'],
    description: 'کاربران قرارداد؛ اگر نباشد از admins seller استفاده می‌شود',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiProperty({ example: 'شرکت طرف قرارداد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contractPartyName: string;

  @ApiPropertyOptional({ example: 'توضیحات قرارداد' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsISO8601({ strict: true })
  contractDate: string;
}
