import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: '09363078987' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  username: string;

  @ApiProperty({
    type: [String],
    example: [
      '01JEX000000000000000000030',
      '01JEX000000000000000000040',
    ],
    description:
      'آرایه شناسه نقش‌ها — اولین آیتم نقش اصلی است. همه باید audience یکسان داشته باشند (نمی‌شود super-admin را با user/seller ترکیب کرد)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsULID({ each: true })
  roleIds: string[];

  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'برای super-admin یا seller هنگام ساخت ادمین',
  })
  @IsOptional()
  @IsULID()
  sellerId?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'MySecurePass123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'Tina' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Tina' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ahmadi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
