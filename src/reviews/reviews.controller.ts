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
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../utils/auth/guards/role.guard.js';
import { RequireRole } from '../utils/auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { userHasRole } from '../utils/auth/types/auth-user.type.js';
import {
  CreateReviewDto,
  ListReviewsQueryDto,
  ModerateReviewDto,
  ReviewResponseDto,
} from './dto/review.dto.js';
import { ReviewsService } from './reviews.service.js';

const ReviewApiResponseDto = createSuccessResponseDto(ReviewResponseDto, {
  code: 'REVIEW_FOUND',
  message: 'Review retrieved successfully',
  name: 'Review',
});

const ReviewsPaginatedApiResponseDto = createPaginatedResponseDto(
  ReviewResponseDto,
  {
    code: 'REVIEWS_FOUND',
    message: 'Reviews retrieved successfully',
    name: 'Reviews',
  },
);

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({
    summary: 'List nested product reviews',
    description:
      'لیست نظرات تأییدشدهٔ محصول به‌صورت نستد (ریشه + replies بدون محدودیت عمق)',
  })
  @ApiResponseMeta({
    code: 'REVIEWS_FOUND',
    message: 'Reviews retrieved successfully',
  })
  @ApiOkResponse({ type: ReviewsPaginatedApiResponseDto })
  findByProduct(@Query() query: ListReviewsQueryDto) {
    return this.reviewsService.findByProduct(query);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create product review or nested reply',
    description:
      'ثبت نظر یا پاسخ با offerId. محصول از روی پیشنهاد resolve می‌شود. اگر کاربر محصول را خریده باشد rating روی کامنت ریشه الزامی است.',
  })
  @ApiResponseMeta({
    code: 'REVIEW_CREATED',
    message: 'Review created successfully',
  })
  @ApiCreatedResponse({ type: ReviewApiResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Moderate review status',
    description: 'تغییر وضعیت نظر توسط ادمین (approved / pending / spam)',
  })
  @ApiResponseMeta({
    code: 'REVIEW_UPDATED',
    message: 'Review updated successfully',
  })
  @ApiOkResponse({ type: ReviewApiResponseDto })
  moderate(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete own review (or any as admin)',
    description: 'حذف نظر خود؛ ادمین می‌تواند هر نظری را حذف کند',
  })
  @ApiResponseMeta({
    code: 'REVIEW_DELETED',
    message: 'Review deleted successfully',
  })
  @ApiOkResponse({
    schema: {
      example: {
        code: 'REVIEW_DELETED',
        message: 'Review deleted successfully',
        data: {},
      },
    },
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    const asAdmin = userHasRole(
      req.user,
      DEFAULT_ROLE_SLUGS.ADMIN,
      DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
    );
    return this.reviewsService.remove(req.user, id, asAdmin);
  }
}
