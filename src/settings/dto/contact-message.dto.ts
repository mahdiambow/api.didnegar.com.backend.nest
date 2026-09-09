import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'علی رضایی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'ali@example.com',
    nullable: true,
    description: 'حداقل یکی از email یا phoneNumber الزامی است',
  })
  @ValidateIf((dto: CreateContactMessageDto) => !dto.phoneNumber?.trim())
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @ApiPropertyOptional({
    example: '09121234567',
    nullable: true,
    description: 'حداقل یکی از email یا phoneNumber الزامی است',
  })
  @ValidateIf((dto: CreateContactMessageDto) => !dto.email?.trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber?: string | null;

  @ApiProperty({ example: 'پشتیبانی سفارش' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({ example: 'سفارش من هنوز ارسال نشده است.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message: string;
}

export class UpdateContactMessageDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    example: 'پیگیری با انبار انجام شد',
    nullable: true,
    description: 'یادداشت داخلی ادمین',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  internalNote?: string | null;

  @ApiPropertyOptional({
    example: 'سفارش شما فردا ارسال می‌شود.',
    nullable: true,
    description: 'پاسخ به کاربر',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  reply?: string | null;
}

export class ListContactMessagesQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ContactMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber: string | null;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiPropertyOptional({ nullable: true })
  internalNote: string | null;

  @ApiPropertyOptional({ nullable: true })
  reply: string | null;

  @ApiProperty({ description: 'تاریخ ارسال' })
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
