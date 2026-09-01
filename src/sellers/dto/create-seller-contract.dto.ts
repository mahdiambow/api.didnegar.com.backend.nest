import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSellerContractDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ example: 'فروشگاه نمونه' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  sellerName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  adminId: string;

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
