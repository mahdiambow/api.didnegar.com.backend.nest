import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginOrSignupResponseDto {
  @ApiPropertyOptional({
    example: '123456',
    description: 'کد OTP — فقط در محیط development برگردانده می‌شود',
  })
  code?: string;

  @ApiProperty({
    example: true,
    description: 'آیا کاربر جدید است یا هنوز رمز عبور تنظیم نکرده',
  })
  isNewUser: boolean;

  @ApiProperty({
    example: 120,
    description: 'مدت اعتبار OTP به ثانیه',
  })
  expiresIn: number;
}
