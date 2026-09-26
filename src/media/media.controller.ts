import { ParseULIDPipe } from '../common/id/index.js';
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../utils/auth/guards/role.guard.js';
import { RequireRole } from '../utils/auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { ApiErrorResponseDto } from '../common/response/dto/api-error-response.dto.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { MediaService } from './media.service.js';
import { MediaThrottlerGuard } from './guards/media-throttler.guard.js';
import {
  AttachMediaAssetDto,
  DirectUploadUrlResponseDto,
  ListMediaAssetsDto,
  MediaAssetResponseDto,
  ReviewMediaAssetDto,
  RequestMediaUploadUrlDto,
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
    summary: 'List media gallery',
    description:
      'لیست گالری رسانه\n\nبا group فیلتر کن (blog/product/setting/seller/other). سلر معمولی فقط رسانه خودش را می‌بیند.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_LIST',
    message: 'Media assets retrieved successfully',
  })
  @ApiOkResponse({ type: MediaListApiResponseDto })
  findAll(@Req() req: { user: AuthUser }, @Query() query: ListMediaAssetsDto) {
    return this.mediaService.findAll(req.user, query);
  }

  @Post('upload-url')
  @RequireRole(...sellerRoles)
  @UseGuards(JwtAuthGuard, RoleGuard, MediaThrottlerGuard)
  @ApiOperation({
    summary: 'Create a direct SeaweedFS upload URL',
    description:
      'product: فروشنده تصویر محصول را بدون اتصال اولیه به محصول در گالری شخصی SeaweedFS آپلود می‌کند و بعداً آن را متصل می‌کند. banner: فقط ادمین. فایل با PUT مستقیم به SeaweedFS آپلود می‌شود؛ credentials هرگز به کلاینت داده نمی‌شود.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_UPLOAD_URL_CREATED',
    message: 'Upload URL created successfully',
  })
  @ApiCreatedResponse({ type: DirectUploadUrlResponseDto })
  createUploadUrl(
    @Req() req: { user: AuthUser },
    @Body() dto: RequestMediaUploadUrlDto,
  ) {
    return this.mediaService.requestUploadUrl(req.user, dto);
  }

  @Post(':id/complete')
  @RequireRole(...sellerRoles)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({
    summary: 'Confirm a direct SeaweedFS upload',
    description:
      'وجود و حجم فایل در SeaweedFS بررسی می‌شود. product: تصویر محصول بدون اتصال اولیه به محصول در گالری فروشنده تأیید می‌شود. بنر: URL عمومی رسانه بازگردانده می‌شود.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_UPLOAD_COMPLETED',
    message: 'Media upload completed successfully',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  completeDirectUpload(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.mediaService.completeDirectUpload(req.user, id);
  }

  @Get(':id')
  @RequireRole(...sellerRoles)
  @ApiOperation({
    summary: 'Get one media item',
    description: 'دریافت یک رسانه',
  })
  @ApiResponseMeta({
    code: 'MEDIA_FOUND',
    message: 'Media asset retrieved successfully',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.mediaService.findOne(req.user, id);
  }

  @Patch(':id/approval')
  @RequireRole(...reviewerRoles)
  @ApiOperation({
    summary: 'Approve or reject media',
    description:
      'تأیید یا رد رسانه\n\napproved → انتقال به gallery و expires_at=null. rejected → expires_at=+24h.',
  })
  @ApiResponseMeta({
    code: 'MEDIA_REVIEWED',
    message: 'Media review updated',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  review(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: ReviewMediaAssetDto,
  ) {
    return this.mediaService.review(req.user, id, dto);
  }

  @Patch(':id/attach')
  @RequireRole(...sellerRoles)
  @ApiOperation({
    summary: 'Attach approved media to product',
    description:
      'اتصال رسانه تأییدشده به محصول و افزودن URL SeaweedFS به تصویر محصول\n\nis_used=true',
  })
  @ApiResponseMeta({
    code: 'MEDIA_ATTACHED',
    message: 'Media attached to product',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  attach(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: AttachMediaAssetDto,
  ) {
    return this.mediaService.attach(req.user, id, dto);
  }

  @Patch(':id/detach')
  @RequireRole(...sellerRoles)
  @ApiOperation({
    summary: 'Detach media from product',
    description: 'جدا کردن رسانه از محصول',
  })
  @ApiResponseMeta({
    code: 'MEDIA_DETACHED',
    message: 'Media detached from product',
  })
  @ApiOkResponse({ type: MediaApiResponseDto })
  detach(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.mediaService.detach(req.user, id);
  }

  @Delete(':id')
  @RequireRole(...sellerRoles)
  @ApiOperation({
    summary: 'Delete unused media',
    description: 'حذف رسانه استفاده‌نشده',
  })
  @ApiResponseMeta({
    code: 'MEDIA_DELETED',
    message: 'Media deleted successfully',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'string', format: 'ulid' } },
    },
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.mediaService.remove(req.user, id);
  }
}
