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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
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
@UseGuards(JwtAuthGuard)
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

  @Get('methods')
  @ApiResponseMeta({
    code: 'SHIPPING_METHODS_FOUND',
    message: 'Shipping methods retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست روش‌های ارسال با pagination' })
  @ApiOkResponse({ type: ShippingMethodsPaginatedApiResponseDto })
  findAll(@Query() query: ListShippingMethodsQueryDto) {
    return this.shippingService.findAll(query);
  }

  @Get('methods/:id')
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_FOUND',
    message: 'Shipping method retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک روش ارسال' })
  @ApiOkResponse({ type: ShippingMethodApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.shippingService.findOne(id);
  }

  @Post('methods')
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_CREATED',
    message: 'Shipping method created successfully',
  })
  @ApiOperation({ summary: 'ایجاد روش ارسال جدید' })
  @ApiOkResponse({ type: ShippingMethodApiResponseDto })
  create(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.create(dto);
  }

  @Patch('methods/:id')
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_UPDATED',
    message: 'Shipping method updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش روش ارسال' })
  @ApiOkResponse({ type: ShippingMethodApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateShippingMethodDto) {
    return this.shippingService.update(id, dto);
  }

  @Delete('methods/:id')
  @ApiResponseMeta({
    code: 'SHIPPING_METHOD_DELETED',
    message: 'Shipping method deleted successfully',
  })
  @ApiOperation({ summary: 'حذف روش ارسال' })
  remove(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }
}
