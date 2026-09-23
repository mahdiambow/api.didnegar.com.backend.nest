import { ParseULIDPipe } from '../common/id/index.js';
import { Body, Req, Param, Query, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../utils/auth/guards/optional-jwt-auth.guard.js';
import { RoleGuard } from '../utils/auth/guards/role.guard.js';
import { RequireRole } from '../utils/auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import {
  CreateSellerOffersDto,
  UpdateSellerOfferDto,
  SellerOfferResponseDto,
  SellerOfferListItemDto,
  ListSellerOffersDto,
  ListMySellerOffersDto,
  ReviewSellerOfferDto,
} from './dto/seller-offer.dto.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { OffersService } from './offers.service.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';

const OfferApiResponseDto = createSuccessResponseDto(SellerOfferResponseDto, {
  code: 'OFFER_FOUND',
  message: 'Seller offer retrieved successfully',
  name: 'Offer',
});

const OffersApiResponseDto = createPaginatedResponseDto(
  SellerOfferListItemDto,
  {
    code: 'OFFERS_FOUND',
    message: 'Offers retrieved successfully',
    name: 'Offers',
  },
);

@ApiTags('Seller Offers')
@Controller('seller-offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'List my seller offers',
    description:
      'لیست پیشنهادهای فروش خودم\n\nsellerId از JWT؛ همه وضعیت‌ها (pending/approved/rejected). فیلتر با approvalStatus.',
  })
  @ApiResponseMeta({
    code: 'OFFERS_FOUND',
    message: 'Offers retrieved successfully',
  })
  @ApiOkResponse({ type: OffersApiResponseDto })
  findMine(
    @Req() req: { user: AuthUser },
    @Query() query: ListMySellerOffersDto,
  ) {
    return this.offersService.findMine(req.user, query);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'List seller offers',
    description:
      'لیست پیشنهادهای فروش\n\nبدون توکن فقط approved؛ با JWT فروشنده، pending/rejected خودش هم دیده می‌شود. برای لیست خودتان از GET /seller-offers/me استفاده کنید.',
  })
  @ApiResponseMeta({
    code: 'OFFERS_FOUND',
    message: 'Offers retrieved successfully',
  })
  @ApiOkResponse({ type: OffersApiResponseDto })
  findAll(
    @Query() query: ListSellerOffersDto,
    @Req() req: { user?: AuthUser | null },
  ) {
    return this.offersService.findAll(query, req.user ?? null);
  }

  @Get(':id/approval')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get seller offer for approve / edit form',
    description: 'دریافت پیشنهاد فروش برای فرم تأیید / ویرایش\n\nآفر به‌همراه آبجکت کامل محصول لینک‌شده برمی‌گردد تا در صفحه تأیید قابل ویرایش باشد.',
  })
  @ApiResponseMeta({
    code: 'OFFER_FOUND',
    message: 'Seller offer found successfully',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  findOneForApproval(@Param('id', ParseULIDPipe) id: string) {
    return this.offersService.findOne(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seller offer', description: 'دریافت پیشنهاد فروش' })
  @ApiResponseMeta({
    code: 'OFFER_FOUND',
    message: 'Seller offer found successfully',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.offersService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Create one or more seller offers',
    description:
      'ایجاد یک یا چند پیشنهاد فروش\n\nsellerId از JWT خوانده می‌شود. اگر productId نباشد یا محصول در کاتالوگ نباشد، از روی فیلد product (و sku/قیمت/موجودی آفر) محصول جدید ساخته می‌شود.',
  })
  @ApiResponseMeta({
    code: 'OFFERS_CREATED',
    message: 'Seller offers created successfully',
  })
  @ApiCreatedResponse({ type: [SellerOfferResponseDto] })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateSellerOffersDto) {
    return this.offersService.create(req.user, dto);
  }

  @Patch(':id/approval')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Approve / reject / set seller offer pending (admin only)',
    description: 'تأیید / رد / بازگرداندن به انتظار پیشنهاد فروش (فقط ادمین)\n\nبا `approved` شدن آفر، محصول لینک‌شده (`productId`) هم `approved` و در صورت نیاز `publish` می‌شود.',
  })
  @ApiResponseMeta({
    code: 'OFFER_REVIEWED',
    message: 'Seller offer approval status updated',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  review(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: ReviewSellerOfferDto,
  ) {
    return this.offersService.review(id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Update seller offer',
    description:
      'ویرایش پیشنهاد فروش\n\nبا هر تغییر، `approvalStatus` آفر (خارج از product) به `pending` برمی‌گردد. تأیید مجدد: `PATCH /seller-offers/:id/approval`.',
  })
  @ApiResponseMeta({
    code: 'OFFER_UPDATED',
    message: 'Seller offer updated successfully',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateSellerOfferDto,
  ) {
    return this.offersService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Delete seller offer', description: 'حذف پیشنهاد فروش' })
  @ApiResponseMeta({
    code: 'OFFER_DELETED',
    message: 'Seller offer deleted successfully',
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.offersService.remove(req.user, id);
  }
}
