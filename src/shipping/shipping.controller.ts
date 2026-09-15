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
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { ShippingService } from './shipping.service.js';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto.js';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto.js';
import { ListShippingMethodsQueryDto } from './dto/list-shipping-methods-query.dto.js';
import {
  ShippingMethodResponseDto,
  ShippingQuoteQueryDto,
  ShippingQuoteResponseDto,
} from './dto/shipping.dto.js';

const ShippingMethodApiResponseDto = createSuccessResponseDto(
  ShippingMethodResponseDto,
  {
    code: 'SHIPPING_METHOD_FOUND',
    message: 'Shipping method retrieved successfully',
    name: 'ShippingMethod',
  },
);

const ShippingMethodsPaginatedApiResponseDto = createPaginatedResponseDto(
  ShippingMethodResponseDto,
  {
    code: 'SHIPPING_METHODS_FOUND',
    message: 'Shipping methods retrieved successfully',
    name: 'ShippingMethods',
  },
);

const ShippingQuoteApiResponseDto = createSuccessResponseDto(
  ShippingQuoteResponseDto,
  {
    code: 'SHIPPING_QUOTE_CALCULATED',
    message: 'Shipping quote calculated successfully',
    name: 'ShippingQuote',
  },
);

@ApiTags('Shipping')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('quote')
  @ApiResponseMeta({
    code: 'SHIPPING_QUOTE_CALCULATED',
    message: 'Shipping quote calculated successfully',
  })
  @ApiOperation({
    summary: 'محاسبه مجموع قیمت بر اساس محصول و روش ارسال',
  })
  @ApiOkResponse({ type: ShippingQuoteApiResponseDto })
  getQuote(@Query() query: ShippingQuoteQueryDto) {
    return this.shippingService.getQuote(query);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.shipping.read)
  @ApiResponseMeta({
    code: 'SHIPPING_METHODS_FOUND',
    message: 'Shipping methods retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست روش‌های ارسال با pagination و فیلتر' })
  @ApiOkResponse({ type: ShippingMethodsPaginatedApiResponseDto })
  findAll(@Query() query: ListShippingMethodsQueryDto) {
    return this.shippingService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.shipping.read)
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_FOUND',
    message: 'Shipping method retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک روش ارسال' })
  @ApiOkResponse({ type: ShippingMethodApiResponseDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.shippingService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.shipping.create)
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_CREATED',
    message: 'Shipping method created successfully',
  })
  @ApiOperation({ summary: 'ایجاد روش ارسال' })
  @ApiOkResponse({ type: ShippingMethodApiResponseDto })
  create(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.shipping.update)
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_UPDATED',
    message: 'Shipping method updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش روش ارسال' })
  @ApiOkResponse({ type: ShippingMethodApiResponseDto })
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateShippingMethodDto,
  ) {
    return this.shippingService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.shipping.delete)
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_DELETED',
    message: 'Shipping method deleted successfully',
  })
  @ApiOperation({ summary: 'حذف روش ارسال' })
  remove(@Param('id', ParseULIDPipe) id: string) {
    return this.shippingService.remove(id);
  }
}
