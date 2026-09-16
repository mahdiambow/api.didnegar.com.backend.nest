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
import { RoleGuard } from '../utils/auth/guards/role.guard.js';
import { RequireRole } from '../utils/auth/decorators/require-role.decorator.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { AdminsService } from './admins.service.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto.js';
import { AdminResponseDto } from './dto/admin-response.dto.js';

const AdminApiResponseDto = createSuccessResponseDto(AdminResponseDto, {
  code: 'ADMIN_FOUND',
  message: 'Admin retrieved successfully',
  name: 'Admin',
});

const AdminsPaginatedApiResponseDto = createPaginatedResponseDto(
  AdminResponseDto,
  {
    code: 'ADMINS_FOUND',
    message: 'Admins retrieved successfully',
    name: 'Admins',
  },
);

@ApiTags('Admins')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRole(DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @ApiResponseMeta({
    code: 'ADMINS_FOUND',
    message: 'Admins retrieved successfully',
  })
  @ApiOperation({ summary: 'List admins (super-admin)', description: 'لیست ادمین‌ها (super-admin)' })
  @ApiOkResponse({ type: AdminsPaginatedApiResponseDto })
  findAll(
    @Req() req: { user: AuthUser },
    @Query() query: ListAdminsQueryDto,
  ) {
    return this.adminsService.findAll(req.user, query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'ADMIN_FOUND',
    message: 'Admin retrieved successfully',
  })
  @ApiOperation({ summary: 'Get one admin', description: 'دریافت یک ادمین' })
  @ApiOkResponse({ type: AdminApiResponseDto })
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.adminsService.findOne(req.user, id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'ADMIN_CREATED',
    message: 'Admin created successfully',
  })
  @ApiOperation({ summary: 'Create admin', description: 'ایجاد ادمین' })
  @ApiOkResponse({ type: AdminApiResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateAdminDto) {
    return this.adminsService.create(req.user, dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'ADMIN_UPDATED',
    message: 'Admin updated successfully',
  })
  @ApiOperation({ summary: 'Update admin', description: 'ویرایش ادمین' })
  @ApiOkResponse({ type: AdminApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.adminsService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'ADMIN_DELETED',
    message: 'Admin deleted successfully',
  })
  @ApiOperation({ summary: 'Delete admin', description: 'حذف ادمین' })
  @ApiOkResponse({
    schema: {
      example: {
        code: 'ADMIN_DELETED',
        message: 'Admin deleted successfully',
        data: {},
      },
    },
  })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.adminsService.remove(req.user, id);
  }
}
