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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { PERMISSIONS } from './permissions.js';
import { RolesService } from './roles.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RoleResponseDto } from './dto/role-response.dto.js';
import { ListRolesQueryDto } from './dto/list-roles-query.dto.js';

const RoleApiResponseDto = createSuccessResponseDto(RoleResponseDto, {
  code: 'ROLE_FOUND',
  message: 'Role retrieved successfully',
  name: 'Role',
});

const RolesPaginatedApiResponseDto = createPaginatedResponseDto(
  RoleResponseDto,
  {
    code: 'ROLES_FOUND',
    message: 'Roles retrieved successfully',
    name: 'Roles',
  },
);

const PermissionsApiResponseDto = createSuccessResponseDto(Object, {
  code: 'PERMISSIONS_FOUND',
  message: 'Permissions retrieved successfully',
  name: 'Permissions',
});

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.roles.read)
  @ApiResponseMeta({
    code: 'PERMISSIONS_FOUND',
    message: 'Permissions retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست permissionهای قابل اختصاص' })
  @ApiOkResponse({ type: PermissionsApiResponseDto })
  getPermissions(@Req() req: { user: AuthUser }) {
    return this.rolesService.getPermissions(req.user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.roles.read)
  @ApiResponseMeta({
    code: 'ROLES_FOUND',
    message: 'Roles retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست نقش‌ها با pagination' })
  @ApiOkResponse({ type: RolesPaginatedApiResponseDto })
  findAll(@Req() req: { user: AuthUser }, @Query() query: ListRolesQueryDto) {
    return this.rolesService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.roles.read)
  @ApiResponseMeta({
    code: 'ROLE_FOUND',
    message: 'Role retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک نقش' })
  @ApiOkResponse({ type: RoleApiResponseDto })
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.rolesService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.roles.create)
  @ApiResponseMeta({
    code: 'ROLE_CREATED',
    message: 'Role created successfully',
  })
  @ApiOperation({ summary: 'ایجاد نقش جدید' })
  @ApiOkResponse({ type: RoleApiResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roles.update)
  @ApiResponseMeta({
    code: 'ROLE_UPDATED',
    message: 'Role updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش نقش' })
  @ApiOkResponse({ type: RoleApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roles.delete)
  @ApiResponseMeta({
    code: 'ROLE_DELETED',
    message: 'Role deleted successfully',
  })
  @ApiOperation({ summary: 'حذف نقش' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.rolesService.remove(req.user, id);
  }
}
