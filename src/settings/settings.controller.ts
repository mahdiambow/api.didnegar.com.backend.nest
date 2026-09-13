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
  ApiBody,
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
  CreateFooterDto,
  UpdateFooterDto,
  FooterResponseDto,
} from './dto/footer.dto.js';
import {
  FOOTER_EXAMPLE,
  FOOTER_RESPONSE_EXAMPLE,
} from './dto/footer.examples.js';
import { SettingsService } from './settings.service.js';

const FooterApiResponseDto = createSuccessResponseDto(FooterResponseDto, {
  code: 'FOOTER_FOUND',
  message: 'Footer settings retrieved successfully',
  name: 'Footer',
});

@ApiTags('Settings')
@Controller('settings/footer')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'دریافت تنظیمات فوتر',
    description:
      'شامل لوگو، متن لوگو، منوی لینک‌ها (با subMenu)، اطلاعات تماس و شبکه‌های اجتماعی',
  })
  @ApiResponseMeta({
    code: 'FOOTER_FOUND',
    message: 'Footer settings found successfully',
  })
  @ApiOkResponse({
    type: FooterApiResponseDto,
    content: {
      'application/json': {
        example: {
          code: 'FOOTER_FOUND',
          message: 'Footer settings found successfully',
          data: FOOTER_RESPONSE_EXAMPLE,
        },
      },
    },
  })
  getFooter() {
    return this.settingsService.getFooter();
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ایجاد تنظیمات فوتر' })
  @ApiBody({
    type: CreateFooterDto,
    examples: {
      sample: {
        summary: 'نمونه کامل فوتر',
        value: FOOTER_EXAMPLE,
      },
    },
  })
  @ApiResponseMeta({
    code: 'FOOTER_CREATED',
    message: 'Footer settings created successfully',
  })
  @ApiCreatedResponse({
    type: FooterApiResponseDto,
    content: {
      'application/json': {
        example: {
          code: 'FOOTER_CREATED',
          message: 'Footer settings created successfully',
          data: FOOTER_RESPONSE_EXAMPLE,
        },
      },
    },
  })
  createFooter(@Body() dto: CreateFooterDto) {
    return this.settingsService.createFooter(dto);
  }

  @Patch()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ویرایش تنظیمات فوتر' })
  @ApiBody({
    type: UpdateFooterDto,
    examples: {
      sample: {
        summary: 'نمونه کامل فوتر',
        value: FOOTER_EXAMPLE,
      },
      logoAndMenuOnly: {
        summary: 'فقط لوگو و منو',
        value: {
          logoUrl: FOOTER_EXAMPLE.logoUrl,
          logoText: FOOTER_EXAMPLE.logoText,
          menuLinks: FOOTER_EXAMPLE.menuLinks,
        },
      },
    },
  })
  @ApiResponseMeta({
    code: 'FOOTER_UPDATED',
    message: 'Footer settings updated successfully',
  })
  @ApiOkResponse({
    type: FooterApiResponseDto,
    content: {
      'application/json': {
        example: {
          code: 'FOOTER_UPDATED',
          message: 'Footer settings updated successfully',
          data: FOOTER_RESPONSE_EXAMPLE,
        },
      },
    },
  })
  updateFooter(@Body() dto: UpdateFooterDto) {
    return this.settingsService.updateFooter(dto);
  }

  @Delete()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف تنظیمات فوتر' })
  @ApiResponseMeta({
    code: 'FOOTER_DELETED',
    message: 'Footer settings deleted successfully',
  })
  removeFooter() {
    return this.settingsService.removeFooter();
  }
}
