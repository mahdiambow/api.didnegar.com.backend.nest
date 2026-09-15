import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsULID } from '../../common/id/index.js';

export class CreateAdminDto {
  @ApiProperty({ example: 'تیم پشتیبانی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: '09121234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  phone: string;

  @ApiPropertyOptional({ example: 'admin@didnegar.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['01JEX000000000000000000030'],
    description: 'شناسه یوزرهایی که به این ادمین لینک می‌شوند (نقش حوزه admin)',
  })
  @IsOptional()
  @IsArray()
  @IsULID({ each: true })
  userIds?: string[];
}
