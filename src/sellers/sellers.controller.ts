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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { SellersService } from './sellers.service.js';
import { CreateSellerDto } from './dto/create-seller.dto.js';
import { UpdateSellerDto } from './dto/update-seller.dto.js';
import { SellerResponseDto } from './dto/seller-response.dto.js';
import { ListSellersQueryDto } from './dto/list-sellers-query.dto.js';

const SellerApiResponseDto = createSuccessResponseDto(SellerResponseDto, {
  code: 'SELLER_FOUND',
  message: 'Seller retrieved successfully',
  name: 'Seller',
});

const SellersPaginatedApiResponseDto = createPaginatedResponseDto(
  SellerResponseDto,
  {
    code: 'SELLERS_FOUND',
    message: 'Sellers retrieved successfully',
    name: 'Sellers',
  },
);

@ApiTags('Sellers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.sellers.read)
  @ApiResponseMeta({
    code: 'SELLERS_FOUND',
    message: 'Sellers retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست فروشندگان' })
  @ApiOkResponse({ type: SellersPaginatedApiResponseDto })
  findAll(@Req() req: { user: AuthUser }, @Query() query: ListSellersQueryDto) {
    return this.sellersService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.sellers.read)
  @ApiResponseMeta({
    code: 'SELLER_FOUND',
    message: 'Seller retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک فروشنده' })
  @ApiOkResponse({ type: SellerApiResponseDto })
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.sellersService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.sellers.create)
  @ApiResponseMeta({
    code: 'SELLER_CREATED',
    message: 'Seller created successfully',
  })
  @ApiOperation({ summary: 'ایجاد فروشنده (super-admin)' })
  @ApiOkResponse({ type: SellerApiResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateSellerDto) {
    return this.sellersService.create(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.sellers.update)
  @ApiResponseMeta({
    code: 'SELLER_UPDATED',
    message: 'Seller updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش فروشنده' })
  @ApiOkResponse({ type: SellerApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateSellerDto,
  ) {
    return this.sellersService.update(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.sellers.delete)
  @ApiResponseMeta({
    code: 'SELLER_DELETED',
    message: 'Seller deleted successfully',
  })
  @ApiOperation({ summary: 'حذف فروشنده (super-admin)' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.sellersService.remove(req.user, id);
  }
}
