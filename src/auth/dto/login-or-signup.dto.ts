import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginOrSignupDto {
  @ApiProperty({
    example: '09123456789',
    description: 'شماره موبایل (۱۱ رقم، با ۰۹ شروع شود)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  mobile: string;
}
