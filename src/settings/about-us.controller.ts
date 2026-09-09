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
  AboutUsResponseDto,
  CreateAboutUsDto,
  UpdateAboutUsDto,
} from './dto/about-us.dto.js';
import { SettingsService } from './settings.service.js';

const AboutUsApiResponseDto = createSuccessResponseDto(AboutUsResponseDto, {
  code: 'ABOUT_US_FOUND',
  message: 'About us retrieved successfully',
  name: 'AboutUs',
});

@ApiTags('About Us')
@Controller('settings/about-us')
export class AboutUsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت درباره ما' })
  @ApiResponseMeta({
    code: 'ABOUT_US_FOUND',
    message: 'About us found successfully',
  })
  @ApiOkResponse({ type: AboutUsApiResponseDto })
  getAboutUs() {
    return this.settingsService.getAboutUs();
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ایجاد درباره ما' })
  @ApiResponseMeta({
    code: 'ABOUT_US_CREATED',
    message: 'About us created successfully',
  })
  @ApiCreatedResponse({ type: AboutUsApiResponseDto })
  createAboutUs(@Body() dto: CreateAboutUsDto) {
    return this.settingsService.createAboutUs(dto);
  }

  @Patch()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ویرایش درباره ما' })
  @ApiResponseMeta({
    code: 'ABOUT_US_UPDATED',
    message: 'About us updated successfully',
  })
  @ApiOkResponse({ type: AboutUsApiResponseDto })
  updateAboutUs(@Body() dto: UpdateAboutUsDto) {
    return this.settingsService.updateAboutUs(dto);
  }

  @Delete()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف درباره ما' })
  @ApiResponseMeta({
    code: 'ABOUT_US_DELETED',
    message: 'About us deleted successfully',
  })
  removeAboutUs() {
    return this.settingsService.removeAboutUs();
  }
}
