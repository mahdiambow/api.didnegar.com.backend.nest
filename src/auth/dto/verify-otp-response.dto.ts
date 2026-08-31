import { ApiProperty } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';
import { UserRole } from '../enums/user-role.enum.js';

export class VerifyOtpDataDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: UserRole.USER, enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: false })
  hasPassword: boolean;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;
}

export const VerifyOtpApiResponseDto = createSuccessResponseDto(
  VerifyOtpDataDto,
  {
    code: 'OTP_VERIFIED',
    message: 'OTP verified successfully',
    name: 'VerifyOtp',
  },
);
