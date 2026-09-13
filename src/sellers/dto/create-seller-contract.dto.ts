import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSellerContractDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'اختیاری — اگر seller وجود نداشته باشد فقط sellerName ذخیره می‌شود',
  })
  @IsOptional()
  @IsULID()
  sellerId?: string;

  @ApiProperty({ example: 'فروشگاه نمونه' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  sellerName: string;

  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000120'],
    description: 'لیست UUID کاربران',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsULID({ each: true })
  userIds: string[];

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
