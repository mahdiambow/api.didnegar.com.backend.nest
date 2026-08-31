import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { ApiErrorResponseDto } from '../common/response/dto/api-error-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { DEFAULT_ROLE_SLUGS, PERMISSIONS } from '../roles/permissions.js';
import { RequirePermissions } from './decorators/require-permissions.decorator.js';
import { RequireRole } from './decorators/require-role.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RoleGuard } from './guards/role.guard.js';

class AuthTestResponseDto {
  message: string;
  userId: string;
  role: string;
}

const AuthTestApiResponseDto = createSuccessResponseDto(AuthTestResponseDto, {
  code: 'TEST_OK',
  message: 'Test endpoint accessed successfully',
  name: 'AuthTest',
});

@ApiTags('Auth Test')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('auth/test')
export class AuthTestController {
  @Get('admin')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.roles.read)
  @ApiResponseMeta({
    code: 'ADMIN_TEST_OK',
    message: 'Admin test endpoint accessed successfully',
  })
  @ApiOperation({
    summary: 'تست guard ادمین — نیاز به permission roles:read',
  })
  @ApiOkResponse({ type: AuthTestApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  adminTest(@Req() req: { user: { sub: string; role: string } }) {
    return {
      message: 'سلام ادمین — دسترسی permission-based تأیید شد',
      userId: req.user.sub,
      role: req.user.role,
    };
  }

  @Get('user')
  @UseGuards(RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.USER)
  @ApiResponseMeta({
    code: 'USER_TEST_OK',
    message: 'User test endpoint accessed successfully',
  })
  @ApiOperation({
    summary: 'تست guard کاربر — فقط نقش user',
  })
  @ApiOkResponse({ type: AuthTestApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  userTest(@Req() req: { user: { sub: string; role: string } }) {
    return {
      message: 'سلام کاربر — دسترسی role-based تأیید شد',
      userId: req.user.sub,
      role: req.user.role,
    };
  }
}
