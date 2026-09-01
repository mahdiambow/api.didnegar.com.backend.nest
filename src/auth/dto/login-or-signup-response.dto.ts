import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';

export class LoginOrSignupDataDto {
  @ApiPropertyOptional({
    example: '123456',
    description: 'فقط در محیط development',
  })
  code?: string;

  @ApiProperty({ example: true })
  isNewUser: boolean;

  @ApiProperty({ example: 120 })
  expiresIn: number;
}

export const LoginOrSignupApiResponseDto = createSuccessResponseDto(
  LoginOrSignupDataDto,
  {
    code: 'OTP_SENT',
    message: 'OTP sent successfully',
    name: 'LoginOrSignup',
  },
);
