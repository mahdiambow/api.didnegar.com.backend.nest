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
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { OfferProductsService } from './offer-products.service.js';
import { CreateOfferProductDto } from './dto/create-offer-product.dto.js';
import { ListOfferProductsQueryDto } from './dto/list-offer-products-query.dto.js';
import { ReviewOfferProductDto } from './dto/review-offer-product.dto.js';
import { OfferProductResponseDto } from './dto/offer-product-response.dto.js';

const OfferProductApiResponseDto = createSuccessResponseDto(
  OfferProductResponseDto,
  {
    code: 'OFFER_PRODUCT_FOUND',
    message: 'Offer product retrieved successfully',
    name: 'OfferProduct',
  },
);

const OfferProductsApiResponseDto = createPaginatedResponseDto(
  OfferProductResponseDto,
  {
    code: 'OFFER_PRODUCTS_FOUND',
    message: 'Offer products retrieved successfully',
    name: 'OfferProducts',
  },
);

@ApiTags('Offer Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('offer-products')
export class OfferProductsController {
  constructor(private readonly offerProductsService: OfferProductsService) {}

  @Get()
  @UseGuards(RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'لیست درخواست‌های محصول فروشنده' })
  @ApiResponseMeta({
    code: 'OFFER_PRODUCTS_FOUND',
    message: 'Offer products retrieved successfully',
  })
  @ApiOkResponse({ type: OfferProductsApiResponseDto })
  findAll(@Query() query: ListOfferProductsQueryDto) {
    return this.offerProductsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'دریافت یک درخواست محصول' })
  @ApiResponseMeta({
    code: 'OFFER_PRODUCT_FOUND',
    message: 'Offer product found successfully',
  })
  @ApiOkResponse({ type: OfferProductApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerProductsService.findOne(id);
  }

  @Post()
  @UseGuards(RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'ثبت درخواست محصول جدید (pending)',
    description:
      'فروشنده درخواست محصول+قیمت می‌دهد؛ بعد از تأیید سوپر فروشنده به Product و SellerOffer تبدیل می‌شود',
  })
  @ApiResponseMeta({
    code: 'OFFER_PRODUCT_CREATED',
    message: 'Offer product created successfully',
  })
  @ApiCreatedResponse({ type: OfferProductApiResponseDto })
  create(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateOfferProductDto,
  ) {
    return this.offerProductsService.create(req.user, dto);
  }

  @Patch(':id/approval')
  @UseGuards(RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'تأیید / رد درخواست محصول',
    description:
      'با `approved` شدن، یک Product و یک SellerOffer ساخته می‌شود و productId/offerId روی همین درخواست ذخیره می‌گردد.\n\nنقش‌های مجاز: `super-seller` | `admin` | `super-admin` (کاربر 09363078987 هر دو نقش super-admin و super-seller را دارد)',
  })
  @ApiResponseMeta({
    code: 'OFFER_PRODUCT_REVIEWED',
    message: 'Offer product approval status updated',
  })
  @ApiOkResponse({ type: OfferProductApiResponseDto })
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewOfferProductDto,
  ) {
    return this.offerProductsService.review(id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SELLER,
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'حذف درخواست محصول (فقط قبل از تأیید)' })
  @ApiResponseMeta({
    code: 'OFFER_PRODUCT_DELETED',
    message: 'Offer product deleted successfully',
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.offerProductsService.remove(req.user, id);
  }
}
