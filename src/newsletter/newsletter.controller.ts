import { Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import {
  ListNewsletterQueryDto,
  NewsletterSubscriptionResponseDto,
} from './dto/newsletter.dto.js';
import { NewsletterService } from './newsletter.service.js';

const NewsletterApiResponseDto = createSuccessResponseDto(
  NewsletterSubscriptionResponseDto,
  {
    code: 'NEWSLETTER_FOUND',
    message: 'Newsletter subscription retrieved successfully',
    name: 'Newsletter',
  },
);

const NewsletterListApiResponseDto = createPaginatedResponseDto(
  NewsletterSubscriptionResponseDto,
  {
    code: 'NEWSLETTER_LIST_FOUND',
    message: 'Newsletter subscriptions retrieved successfully',
    name: 'NewsletterList',
  },
);

@ApiTags('Newsletter')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: 'عضویت در خبرنامه',
    description:
      'userId از JWT خوانده می‌شود و ایمیل از دیتابیس کاربر گرفته می‌شود (بدون body).',
  })
  @ApiResponseMeta({
    code: 'NEWSLETTER_SUBSCRIBED',
    message: 'Subscribed to newsletter successfully',
  })
  @ApiCreatedResponse({ type: NewsletterApiResponseDto })
  subscribe(@Req() req: { user: AuthUser }) {
    return this.newsletterService.subscribe(req.user.sub);
  }

  @Post('unsubscribe')
  @ApiOperation({
    summary: 'لغو عضویت در خبرنامه',
    description: 'userId از JWT خوانده می‌شود.',
  })
  @ApiResponseMeta({
    code: 'NEWSLETTER_UNSUBSCRIBED',
    message: 'Unsubscribed from newsletter successfully',
  })
  @ApiOkResponse({ type: NewsletterApiResponseDto })
  unsubscribe(@Req() req: { user: AuthUser }) {
    return this.newsletterService.unsubscribe(req.user.sub);
  }

  @Get('me')
  @ApiOperation({ summary: 'وضعیت عضویت خبرنامه کاربر لاگین‌شده' })
  @ApiResponseMeta({
    code: 'NEWSLETTER_FOUND',
    message: 'Newsletter subscription retrieved successfully',
  })
  @ApiOkResponse({ type: NewsletterApiResponseDto })
  me(@Req() req: { user: AuthUser }) {
    return this.newsletterService.mySubscription(req.user.sub);
  }

  @Get()
  @UseGuards(RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'لیست اعضای خبرنامه (ادمین)' })
  @ApiResponseMeta({
    code: 'NEWSLETTER_LIST_FOUND',
    message: 'Newsletter subscriptions retrieved successfully',
  })
  @ApiOkResponse({ type: NewsletterListApiResponseDto })
  findAll(@Query() query: ListNewsletterQueryDto) {
    return this.newsletterService.findAll(query);
  }

  @Delete('me')
  @ApiOperation({
    summary: 'لغو عضویت (همان unsubscribe)',
    description: 'userId از JWT خوانده می‌شود.',
  })
  @ApiResponseMeta({
    code: 'NEWSLETTER_UNSUBSCRIBED',
    message: 'Unsubscribed from newsletter successfully',
  })
  @ApiOkResponse({ type: NewsletterApiResponseDto })
  removeMe(@Req() req: { user: AuthUser }) {
    return this.newsletterService.unsubscribe(req.user.sub);
  }
}
