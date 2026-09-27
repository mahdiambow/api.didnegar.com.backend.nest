import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { UserResponseDto } from '../utils/auth/dto/user-response.dto.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto.js';
import { RevokeUserRolesDto } from './dto/revoke-user-roles.dto.js';
import { UserRolesResponseDto } from './dto/user-roles-response.dto.js';

const UserApiResponseDto = createSuccessResponseDto(UserResponseDto, {
  code: 'USER_FOUND',
  message: 'User retrieved successfully',
  name: 'User',
});

const UsersPaginatedApiResponseDto = createPaginatedResponseDto(
  UserResponseDto,
  {
    code: 'USERS_FOUND',
    message: 'Users retrieved successfully',
    name: 'Users',
  },
);

const UserRolesApiResponseDto = createSuccessResponseDto(UserRolesResponseDto, {
  code: 'USER_ROLES_FOUND',
  message: 'User roles retrieved successfully',
  name: 'UserRoles',
});

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.users.read)
  @ApiResponseMeta({
    code: 'USERS_FOUND',
    message: 'Users retrieved successfully',
  })
  @ApiOperation({
    summary: 'List users with pagination',
    description: 'لیست کاربران با pagination\n\nفیلتر اختیاری search روی username / displayName / email / firstName / lastName',
  })
  @ApiOkResponse({ type: UsersPaginatedApiResponseDto })
  findAll(@Req() req: { user: AuthUser }, @Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(req.user, query);
  }

  @Get('me')
  @ApiResponseMeta({
    code: 'USER_FOUND',
    message: 'User retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get current user from token',
    description: 'دریافت مشخصات کاربر لاگین‌شده — شناسه از JWT خوانده می‌شود',
  })
  @ApiOkResponse({ type: UserApiResponseDto })
  me(@Req() req: { user: AuthUser }) {
    return this.usersService.findOne(req.user, req.user.sub);
  }

  @Get(':id/roles')
  @RequirePermissions(PERMISSIONS.users.read)
  @ApiResponseMeta({
    code: 'USER_ROLES_FOUND',
    message: 'User roles retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get user roles',
    description: 'مشاهده نقش اصلی و نقش‌های اضافهٔ کاربر',
  })
  @ApiOkResponse({ type: UserRolesApiResponseDto })
  getRoles(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.usersService.getRoles(req.user, id);
  }

  @Post(':id/roles')
  @RequirePermissions(PERMISSIONS.users.update)
  @ApiResponseMeta({
    code: 'USER_ROLES_UPDATED',
    message: 'User roles assigned successfully',
  })
  @ApiOperation({
    summary: 'Assign roles to user',
    description:
      'افزودن نقش به کاربر (merge). برای نقش‌های seller/admin در صورت نیاز seller/admin لینک می‌شود.',
  })
  @ApiOkResponse({ type: UserRolesApiResponseDto })
  assignRoles(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: AssignUserRolesDto,
  ) {
    return this.usersService.assignRoles(req.user, id, dto);
  }

  @Delete(':id/roles')
  @RequirePermissions(PERMISSIONS.users.update)
  @ApiResponseMeta({
    code: 'USER_ROLES_UPDATED',
    message: 'User roles revoked successfully',
  })
  @ApiOperation({
    summary: 'Revoke roles from user',
    description:
      'حذف نقش از کاربر. اگر نقش اصلی حذف شود، newPrimaryRoleId الزامی است.',
  })
  @ApiOkResponse({ type: UserRolesApiResponseDto })
  revokeRoles(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: RevokeUserRolesDto,
  ) {
    return this.usersService.revokeRoles(req.user, id, dto);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.users.read)
  @ApiResponseMeta({
    code: 'USER_FOUND',
    message: 'User retrieved successfully',
  })
  @ApiOperation({ summary: 'Get one user', description: 'دریافت یک کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.usersService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.users.create)
  @ApiResponseMeta({
    code: 'USER_CREATED',
    message: 'User created successfully',
  })
  @ApiOperation({ summary: 'Create user', description: 'ایجاد کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.users.update)
  @ApiResponseMeta({
    code: 'USER_UPDATED',
    message: 'User updated successfully',
  })
  @ApiOperation({ summary: 'Update user', description: 'ویرایش کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.users.delete)
  @ApiResponseMeta({
    code: 'USER_DELETED',
    message: 'User deleted successfully',
  })
  @ApiOperation({ summary: 'Delete user', description: 'حذف کاربر' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.usersService.remove(req.user, id);
  }
}
