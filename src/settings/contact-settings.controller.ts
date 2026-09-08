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
  ContactSettingsResponseDto,
  CreateContactSettingsDto,
  UpdateContactSettingsDto,
} from './dto/contact-settings.dto.js';
import { SettingsService } from './settings.service.js';

const ContactSettingsApiResponseDto = createSuccessResponseDto(
  ContactSettingsResponseDto,
  {
    code: 'CONTACT_SETTINGS_FOUND',
    message: 'Contact settings retrieved successfully',
    name: 'ContactSettings',
  },
);

@ApiTags('Contact Us')
@Controller('settings/contact-us')
export class ContactSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت تنظیمات صفحه تماس با ما' })
  @ApiResponseMeta({
    code: 'CONTACT_SETTINGS_FOUND',
    message: 'Contact settings found successfully',
  })
  @ApiOkResponse({ type: ContactSettingsApiResponseDto })
  getContactSettings() {
    return this.settingsService.getContactSettings();
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ایجاد تنظیمات تماس با ما' })
  @ApiResponseMeta({
    code: 'CONTACT_SETTINGS_CREATED',
    message: 'Contact settings created successfully',
  })
  @ApiCreatedResponse({ type: ContactSettingsApiResponseDto })
  createContactSettings(@Body() dto: CreateContactSettingsDto) {
    return this.settingsService.createContactSettings(dto);
  }

  @Patch()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ویرایش تنظیمات تماس با ما' })
  @ApiResponseMeta({
    code: 'CONTACT_SETTINGS_UPDATED',
    message: 'Contact settings updated successfully',
  })
  @ApiOkResponse({ type: ContactSettingsApiResponseDto })
  updateContactSettings(@Body() dto: UpdateContactSettingsDto) {
    return this.settingsService.updateContactSettings(dto);
  }

  @Delete()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف تنظیمات تماس با ما' })
  @ApiResponseMeta({
    code: 'CONTACT_SETTINGS_DELETED',
    message: 'Contact settings deleted successfully',
  })
  removeContactSettings() {
    return this.settingsService.removeContactSettings();
  }
}
