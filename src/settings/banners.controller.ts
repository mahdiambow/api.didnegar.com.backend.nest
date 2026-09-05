import {
  Body,
  Param,
  ParseUUIDPipe,
  Query,
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
  CreateBannerDto,
  UpdateBannerDto,
  BannerResponseDto,
} from './dto/banner.dto.js';
import { BannersService } from './banners.service.js';
import { ListBannersQueryDto } from './dto/banner.dto.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';

const BannerApiResponseDto = createSuccessResponseDto(BannerResponseDto, {
  code: 'BANNER_FOUND',
  message: 'Banner settings retrieved successfully',
  name: 'Banner',
});

const BannersApiResponseDto = createPaginatedResponseDto(BannerResponseDto, {
  code: 'BANNERS_FOUND',
  message: 'Banners retrieved successfully',
  name: 'Banners',
});

@ApiTags('Settings')
@Controller('settings/banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'لیست بنرها با فیلتر محل نمایش، بخش و دسته‌بندی' })
  @ApiResponseMeta({
    code: 'BANNERS_FOUND',
    message: 'Banners retrieved successfully',
  })
  @ApiOkResponse({ type: BannersApiResponseDto })
  findAll(@Query() query: ListBannersQueryDto) {
    return this.bannersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت تنظیمات بنر' })
  @ApiResponseMeta({
    code: 'BANNER_FOUND',
    message: 'Banner settings found successfully',
  })
  @ApiOkResponse({ type: BannerApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ایجاد تنظیمات بنر' })
  @ApiResponseMeta({
    code: 'BANNER_CREATED',
    message: 'Banner settings created successfully',
  })
  @ApiCreatedResponse({ type: BannerApiResponseDto })
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'ویرایش تنظیمات بنر' })
  @ApiResponseMeta({
    code: 'BANNER_UPDATED',
    message: 'Banner settings updated successfully',
  })
  @ApiOkResponse({ type: BannerApiResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف تنظیمات بنر' })
  @ApiResponseMeta({
    code: 'BANNER_DELETED',
    message: 'Banner settings deleted successfully',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.remove(id);
  }
}
