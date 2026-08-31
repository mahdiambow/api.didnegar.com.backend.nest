import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '09363078987',
    description: 'شماره موبایل (همان شماره‌ای که OTP برایش ارسال شده)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  mobile: string;

  @ApiProperty({
    example: '123456',
    description: 'کد ۶ رقمی OTP',
  })
  @IsString()
  @Length(6, 6, { message: 'کد تایید باید ۶ رقم باشد' })
  code: string;
}
