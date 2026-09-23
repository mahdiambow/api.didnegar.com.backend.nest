import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @ApiProperty({ example: 'منزل' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'تهران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;

  @ApiProperty({ example: 'تهران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'خیابان ولیعصر، پلاک ۱۰' })
  @IsString()
  @IsNotEmpty()
  addressDetail: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: '۱۰' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  plaque?: string;

  @ApiPropertyOptional({ example: '۳' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ example: 'زنگ واحد ۳' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 35.6892 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 51.389 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  long?: number;

  @ApiProperty({ example: 'کاربر نمونه' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  recipientFullName: string;

  @ApiPropertyOptional({ example: '09333333333' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientPhone?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
