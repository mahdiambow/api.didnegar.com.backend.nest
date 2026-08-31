import { ApiProperty } from '@nestjs/swagger';
import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';

export class SetPasswordDataDto {}

export const SetPasswordApiResponseDto = createSuccessResponseDto(
  SetPasswordDataDto,
  {
    code: 'PASSWORD_SET',
    message: 'Password set successfully',
    name: 'SetPassword',
  },
);
