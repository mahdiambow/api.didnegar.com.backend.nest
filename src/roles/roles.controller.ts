import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @ApiResponseMeta({
    code: 'PERMISSIONS_FOUND',
    message: 'Permissions retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست تمام permissionهای تعریف‌شده' })
  @ApiOkResponse({ type: PermissionsApiResponseDto })
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get()
  @ApiResponseMeta({
    code: 'ROLES_FOUND',
    message: 'Roles retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست نقش‌ها با pagination' })
  @ApiOkResponse({ type: RolesPaginatedApiResponseDto })
  findAll(@Query() query: ListRolesQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'ROLE_FOUND',
    message: 'Role retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک نقش' })
  @ApiOkResponse({ type: RoleApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'ROLE_CREATED',
    message: 'Role created successfully',
  })
  @ApiOperation({ summary: 'ایجاد نقش جدید' })
  @ApiOkResponse({ type: RoleApiResponseDto })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'ROLE_UPDATED',
    message: 'Role updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش نقش' })
  @ApiOkResponse({ type: RoleApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'ROLE_DELETED',
    message: 'Role deleted successfully',
  })
  @ApiOperation({ summary: 'حذف نقش' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
