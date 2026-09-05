import { ApiProperty } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';
import { UserResponseDto } from './user-response.dto.js';

export class VerifyOtpDataDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

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
