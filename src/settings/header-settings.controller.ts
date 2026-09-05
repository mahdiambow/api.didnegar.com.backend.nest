import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { RequireRole } from '../auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import {
  CreateHeaderDto,
  UpdateHeaderDto,
  HeaderResponseDto,
} from './dto/header.dto.js';
import { SettingsService } from './settings.service.js';

const HeaderApiResponseDto = createSuccessResponseDto(HeaderResponseDto, {
  code: 'HEADER_FOUND',
  message: 'Header settings retrieved successfully',
  name: 'Header',
});

@ApiTags('Settings')
@Controller('settings/header')
export class HeaderSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت تنظیمات هدر' })
  @ApiResponseMeta({
    code: 'HEADER_FOUND',
    message: 'Header settings found successfully',
  })
  @ApiOkResponse({ type: HeaderApiResponseDto })
  getHeader() {
    return this.settingsService.getHeader();
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ایجاد تنظیمات هدر' })
  @ApiResponseMeta({
    code: 'HEADER_CREATED',
    message: 'Header settings created successfully',
  })
  @ApiCreatedResponse({ type: HeaderApiResponseDto })
  createHeader(@Body() dto: CreateHeaderDto) {
    return this.settingsService.createHeader(dto);
  }

  @Patch()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ویرایش تنظیمات هدر' })
  @ApiResponseMeta({
    code: 'HEADER_UPDATED',
    message: 'Header settings updated successfully',
  })
  @ApiOkResponse({ type: HeaderApiResponseDto })
  updateHeader(@Body() dto: UpdateHeaderDto) {
    return this.settingsService.updateHeader(dto);
  }

  @Delete()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف تنظیمات هدر' })
  @ApiResponseMeta({
    code: 'HEADER_DELETED',
    message: 'Header settings deleted successfully',
  })
  removeHeader() {
    return this.settingsService.removeHeader();
  }
}
