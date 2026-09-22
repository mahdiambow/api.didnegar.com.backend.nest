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
    description: [
      'لیست آفرهای **خود فروشنده** — `sellerId` از JWT خوانده می‌شود.',
      '',
      '- پیش‌فرض: همه وضعیت‌ها (`pending` / `approved` / `rejected`)',
      '- فیلتر: `approvalStatus` / `productId` / `isActive` / دسته',
      '- pending فروشنده‌های دیگر هرگز دیده نمی‌شود',
      '',
      '### نمونه',
      '```',
      'GET /seller-offers/me?page=1&limit=20',
      'GET /seller-offers/me?approvalStatus=pending',
      'GET /seller-offers/me?approvalStatus=approved&productId=01JEX...',
      '```',
    ].join('\n'),
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
    description: [
      'لیست پیشنهادهای فروش (کاتالوگ عمومی)',
      '',
      '- بدون توکن: فقط `approved`',
      '- با توکن فروشنده: `approved` همه + `pending`/`rejected` مربوط به همان فروشنده',
      '- برای فقط آفرهای خودتان از `GET /seller-offers/me` استفاده کنید',
    ].join('\n'),
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
    description: [
      'ایجاد پیشنهاد فروش — `sellerId` از JWT.',
      '',
      '### سناریوها',
      '1. **محصول موجود در کاتالوگ:** `productId` بفرست → فقط آفر ساخته می‌شود',
      '2. **محصول جدید (نیست در products):** `productId` نفرست و فیلد `product` (+ sku/price/stock) بفرست →',
      '   محصول با `approvalStatus=pending` به کاتالوگ اضافه می‌شود و آفر pending ساخته می‌شود',
      '',
      '### بعد از ساخت',
      '- کاتالوگ عمومی: `GET /products?approvalStatus=approved&status=publish`',
      '- لیست خود فروشنده: `GET /seller-offers/me` (همه وضعیت‌ها؛ فیلتر `approvalStatus`)',
      '- تأیید ادمین: `PATCH /seller-offers/{id}/approval` → آفر + محصول `approved`/`publish`',
    ].join('\n'),
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
    description: 'ویرایش پیشنهاد فروش\n\nتغییر قیمت و سایر فیلدها فوری اعمال می‌شود',
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
