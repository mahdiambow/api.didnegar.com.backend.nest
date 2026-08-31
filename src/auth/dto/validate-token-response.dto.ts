import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum.js';

export class ValidateTokenResponseDto {
  @ApiProperty({ example: true, description: 'آیا توکن معتبر است' })
  valid: boolean;

  @ApiProperty({
    example: false,
    description: 'آیا access token با refresh token تمدید شده',
  })
  refreshed: boolean;

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

  @ApiPropertyOptional({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDA5MDB9.example',
    description: 'Access token جدید (فقط در صورت refresh)',
  })
  accessToken?: string;

  @ApiPropertyOptional({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAzMDAwMDAwfQ.example',
    description: 'Refresh token جدید (فقط در صورت refresh)',
  })
  refreshToken?: string;
}
