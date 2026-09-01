import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';

export class ValidateTokenDataDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiProperty({ example: false })
  refreshed: boolean;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'user' })
  role: string;

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
