import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
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
import type { AuthUser } from './types/auth-user.type.js';

class AuthTestResponseDto {
  @ApiProperty({ example: 'سلام Didnegar — دسترسی تأیید شد' })
  message: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({
    example: 'super-admin',
    description: 'نقش اصلی',
  })
  role: string;

  @ApiProperty({
    type: [String],
    example: ['super-admin', 'super-seller'],
    description: 'نقش اصلی + نقش‌های اضافه',
  })
  roles: string[];

  @ApiProperty({ example: null, nullable: true })
  sellerId: string | null;
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
  @Get('super-admin')
  @UseGuards(RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiResponseMeta({
    code: 'SUPER_ADMIN_TEST_OK',
    message: 'Super admin test endpoint accessed successfully',
  })
  @ApiOperation({
    summary: 'تست Didnegar super-admin — دسترسی cross-tenant',
  })
  @ApiOkResponse({ type: AuthTestApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  superAdminTest(@Req() req: { user: AuthUser }) {
    return {
      message: 'سلام Didnegar — دسترسی super-admin تأیید شد',
      userId: req.user.sub,
      role: req.user.role,
      roles: req.user.roles,
      sellerId: req.user.sellerId,
    };
  }

  @Get('super-seller')
  @UseGuards(RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.SUPER_SELLER)
  @ApiResponseMeta({
    code: 'SUPER_SELLER_TEST_OK',
    message: 'Super seller test endpoint accessed successfully',
  })
  @ApiOperation({
    summary:
      'تست super-seller — تأیید offer-product؛ کاربر 09363078987 هر دو نقش را دارد',
  })
  @ApiOkResponse({ type: AuthTestApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  superSellerTest(@Req() req: { user: AuthUser }) {
    return {
      message: 'سلام سوپر فروشنده — دسترسی تأیید شد',
      userId: req.user.sub,
      role: req.user.role,
      roles: req.user.roles,
      sellerId: req.user.sellerId,
    };
  }

  @Get('seller')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.inventory.read)
  @ApiResponseMeta({
    code: 'SELLER_TEST_OK',
    message: 'Seller test endpoint accessed successfully',
  })
  @ApiOperation({
    summary: 'تست seller — نیاز به permission inventory:read',
  })
  @ApiOkResponse({ type: AuthTestApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  sellerTest(@Req() req: { user: AuthUser }) {
    return {
      message: 'سلام فروشنده — دسترسی tenant-based تأیید شد',
      userId: req.user.sub,
      role: req.user.role,
      roles: req.user.roles,
      sellerId: req.user.sellerId,
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
  userTest(@Req() req: { user: AuthUser }) {
    return {
      message: 'سلام کاربر — دسترسی role-based تأیید شد',
      userId: req.user.sub,
      role: req.user.role,
      roles: req.user.roles,
      sellerId: req.user.sellerId,
    };
  }
}
