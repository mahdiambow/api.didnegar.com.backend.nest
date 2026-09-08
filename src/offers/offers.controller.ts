import {
  Body,
  Req,
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
  CreateSellerOffersDto,
  UpdateSellerOfferDto,
  SellerOfferResponseDto,
  ListSellerOffersDto,
  ReviewSellerOfferDto,
} from './dto/seller-offer.dto.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { OffersService } from './offers.service.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';

const OfferApiResponseDto = createSuccessResponseDto(SellerOfferResponseDto, {
  code: 'OFFER_FOUND',
  message: 'Seller offer retrieved successfully',
  name: 'Offer',
});

const OffersApiResponseDto = createPaginatedResponseDto(
  SellerOfferResponseDto,
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

  @Get()
  @ApiOperation({
    summary: 'لیست پیشنهادهای فروش با فیلتر محصول و فروشنده',
  })
  @ApiResponseMeta({
    code: 'OFFERS_FOUND',
    message: 'Offers retrieved successfully',
  })
  @ApiOkResponse({ type: OffersApiResponseDto })
  findAll(@Query() query: ListSellerOffersDto) {
    return this.offersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت پیشنهاد فروش' })
  @ApiResponseMeta({
    code: 'OFFER_FOUND',
    message: 'Seller offer found successfully',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'ایجاد یک یا چند پیشنهاد فروش',
    description: 'با آرایه items می‌توان چند محصول را یکجا قیمت‌گذاری کرد',
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
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'تأیید / رد / بازگرداندن به انتظار پیشنهاد فروش (فقط ادمین)',
  })
  @ApiResponseMeta({
    code: 'OFFER_REVIEWED',
    message: 'Seller offer approval status updated',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewSellerOfferDto,
  ) {
    return this.offersService.review(id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'ویرایش پیشنهاد فروش',
    description: 'تغییر قیمت و سایر فیلدها فوری اعمال می‌شود',
  })
  @ApiResponseMeta({
    code: 'OFFER_UPDATED',
    message: 'Seller offer updated successfully',
  })
  @ApiOkResponse({ type: OfferApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSellerOfferDto,
  ) {
    return this.offersService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'حذف پیشنهاد فروش' })
  @ApiResponseMeta({
    code: 'OFFER_DELETED',
    message: 'Seller offer deleted successfully',
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.offersService.remove(req.user, id);
  }
}
