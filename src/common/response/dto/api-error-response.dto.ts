import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiFieldErrorDto } from './api-field-error.dto.js';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'USER_NOT_FOUND' })
  code: string;

  @ApiProperty({ example: 'User not found' })
  message: string;

  @ApiPropertyOptional({ type: [ApiFieldErrorDto] })
  errors?: ApiFieldErrorDto[];
}
