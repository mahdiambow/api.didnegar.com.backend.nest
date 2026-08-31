import { ApiProperty } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';
import { UserResponseDto } from './user-response.dto.js';

export class LoginWithPasswordDataDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;
}

export const LoginWithPasswordApiResponseDto = createSuccessResponseDto(
  LoginWithPasswordDataDto,
  {
    code: 'LOGIN_SUCCESS',
    message: 'Logged in successfully',
    name: 'LoginWithPassword',
  },
);
