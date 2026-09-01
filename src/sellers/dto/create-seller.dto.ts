import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { BusinessType, SellerStatus } from '../entities/seller.enums.js';
import { CreateSellerContractNestedDto } from './create-seller-contract-nested.dto.js';

export class CreateSellerDto {
  @ApiProperty({ example: 'فروشگاه نمونه' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'sample-shop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط می‌تواند شامل حروف کوچک، عدد و - باشد',
  })
  slug: string;

  @ApiProperty({ example: 'شرکت نمونه' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  businessName: string;

  @ApiPropertyOptional({ enum: BusinessType, example: BusinessType.RETAIL })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiProperty({ example: 'shop@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nationalId?: string;

  @ApiPropertyOptional({ example: 'REG-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'تهران، خیابان ولیعصر' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ enum: SellerStatus, example: SellerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SellerStatus)
  status?: SellerStatus;

  @ApiPropertyOptional({
    type: CreateSellerContractNestedDto,
    description: 'قرارداد فروشنده (همزمان با ایجاد seller ثبت می‌شود)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSellerContractNestedDto)
  contract?: CreateSellerContractNestedDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440001'],
    description: 'لیست UUID ادمین‌های فروشنده',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  admins?: string[];
}
