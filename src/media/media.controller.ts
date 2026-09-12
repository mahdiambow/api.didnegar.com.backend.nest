import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { RequireRole } from '../auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { ApiErrorResponseDto } from '../common/response/dto/api-error-response.dto.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { mediaConfig } from './media.config.js';
import { MediaService } from './media.service.js';
import { MediaThrottlerGuard } from './guards/media-throttler.guard.js';
import {
  AttachMediaAssetDto,
  ListMediaAssetsDto,
  MediaAssetResponseDto,
  ReviewMediaAssetDto,
  UploadMediaDto,
} from './dto/media.dto.js';

const MediaApiResponseDto = createSuccessResponseDto(MediaAssetResponseDto, {
  code: 'MEDIA_FOUND',
  message: 'Media asset retrieved successfully',
  name: 'Media',
});

const MediaListApiResponseDto = createPaginatedResponseDto(
  MediaAssetResponseDto,
  {
    code: 'MEDIA_LIST',
    message: 'Media assets retrieved successfully',
    name: 'MediaList',
  },
);

const sellerRoles = [
  DEFAULT_ROLE_SLUGS.SELLER,
  DEFAULT_ROLE_SLUGS.SUPER_SELLER,
  DEFAULT_ROLE_SLUGS.ADMIN,
  DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
] as const;

const reviewerRoles = [
  DEFAULT_ROLE_SLUGS.SUPER_SELLER,
  DEFAULT_ROLE_SLUGS.ADMIN,
  DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
] as const;

@ApiTags('Media Gallery')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @RequireRole(...sellerRoles)
  @ApiOperation({
    summary: 'لیست گالری رسانه',
    description:
      'با group فیلتر کن (blog/product/setting/seller/other). سلر معمولی فقط رسانه خودش را می‌بیند.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_LIST',
    message: 'Media assets retrieved successfully',
  })
  @ApiOkResponse({ type: MediaListApiResponseDto })
  findAll(
    @Req() req: { user: AuthUser },
    @Query() query: ListMediaAssetsDto,
  ) {
    return this.mediaService.findAll(req.user, query);
  }

  @Post('upload')
  @ApiBearerAuth('access-token')
  @RequireRole(...sellerRoles)
  @UseGuards(JwtAuthGuard, RoleGuard, MediaThrottlerGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: mediaConfig.maxFileBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'آپلود فایل رسانه — قبلش از Authorize توکن را بگذار',
    type: UploadMediaDto,
  })
  @ApiOperation({
    summary: 'آپلود رسانه به گالری (staging)',
    description:
      'فیلد group مسیر فولدر را مشخص می‌کند. برای seller مسیر seller/{sellerId}/ است. sellerId از JWT خوانده می‌شود. از دکمه Authorize بالای صفحه توکن را ست کن.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_UPLOADED',
    message: 'Media uploaded successfully',
  })
  @ApiCreatedResponse({ type: MediaApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  upload(
    @Req() req: { user: AuthUser },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    return this.mediaService.upload(req.user, file, dto);
  }

  @Get(':id')
  @RequireRole(...sellerRoles)
  @ApiOperation({ summary: 'دریافت یک رسانه' })
  @ApiResponseMeta({
    code: 'MEDIA_FOUND',
    message: 'Media asset retrieved successfully',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mediaService.findOne(req.user, id);
  }

  @Patch(':id/approval')
  @RequireRole(...reviewerRoles)
  @ApiOperation({
    summary: 'تأیید یا رد رسانه',
    description:
      'approved → انتقال به gallery و expires_at=null. rejected → expires_at=+24h.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_REVIEWED',
    message: 'Media review updated',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  review(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewMediaAssetDto,
  ) {
    return this.mediaService.review(req.user, id, dto);
  }

  @Patch(':id/attach')
  @RequireRole(...sellerRoles)
  @ApiOperation({
    summary: 'اتصال رسانه تأییدشده به محصول',
    description: 'is_used=true',
  })
  @ApiResponseMeta({
    code: 'MEDIA_ATTACHED',
    message: 'Media attached to product',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  attach(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachMediaAssetDto,
  ) {
    return this.mediaService.attach(req.user, id, dto);
  }

  @Patch(':id/detach')
  @RequireRole(...sellerRoles)
  @ApiOperation({ summary: 'جدا کردن رسانه از محصول' })
  @ApiResponseMeta({
    code: 'MEDIA_DETACHED',
    message: 'Media detached from product',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  detach(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mediaService.detach(req.user, id);
  }

  @Delete(':id')
  @RequireRole(...sellerRoles)
  @ApiOperation({ summary: 'حذف رسانه استفاده‌نشده' })
  @ApiResponseMeta({
    code: 'MEDIA_DELETED',
    message: 'Media deleted successfully',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
    },
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mediaService.remove(req.user, id);
  }
}
