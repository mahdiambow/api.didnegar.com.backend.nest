import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../../common/response/dto/create-success-response.dto.js';

export class ValidateTokenDataDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiProperty({ example: false })
  refreshed: boolean;

  @ApiProperty({ example: '01JEX000000000000000000010' })
  userId: string;

  @ApiProperty({
    example: 'super-admin',
    description: 'نقش اصلی کاربر',
  })
  role: string;

  @ApiProperty({
    type: [String],
    example: ['super-admin', 'super-seller'],
    description: 'نقش اصلی + نقش‌های اضافه (برای RoleGuard استفاده می‌شود)',
  })
  roles: string[];

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'شناسه فروشنده در صورت وجود',
  })
  sellerId?: string | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'شناسه ادمین در صورت وجود',
  })
  adminId?: string | null;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken?: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken?: string;
}

export const ValidateTokenApiResponseDto = createSuccessResponseDto(
  ValidateTokenDataDto,
  {
    code: 'TOKEN_VALIDATED',
    message: 'Token validated successfully',
    name: 'ValidateToken',
  },
);
