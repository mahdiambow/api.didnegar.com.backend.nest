import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum.js';

export class VerifyOtpResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه کاربر',
  })
  userId: string;

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    description: 'نقش کاربر',
  })
  role: UserRole;

  @ApiProperty({
    example: false,
    description: 'آیا کاربر رمز عبور تنظیم کرده است',
  })
  hasPassword: boolean;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDA5MDB9.example',
    description: 'Access token (۱۵ دقیقه اعتبار)',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAzMDAwMDAwfQ.example',
    description: 'Refresh token (۳۰ روز اعتبار)',
  })
  refreshToken: string;
}
