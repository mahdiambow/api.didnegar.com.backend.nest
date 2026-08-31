import { createSuccessResponseDto } from '../../common/response/dto/create-success-response.dto.js';
import { UserResponseDto } from './user-response.dto.js';

export const SetPasswordApiResponseDto = createSuccessResponseDto(
  UserResponseDto,
  {
    code: 'PASSWORD_SET',
    message: 'Password set successfully',
    name: 'SetPassword',
  },
);
