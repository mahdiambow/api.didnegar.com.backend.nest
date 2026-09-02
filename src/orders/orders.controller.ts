import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';

const OrderApiResponseDto = createSuccessResponseDto(OrderResponseDto, {
  code: 'ORDER_FOUND',
  message: 'Order retrieved successfully',
  name: 'Order',
});

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiResponseMeta({
    code: 'ORDER_CREATED',
    message: 'Order created successfully',
  })
  @ApiOperation({ summary: 'ایجاد سفارش' })
  @ApiOkResponse({ type: OrderApiResponseDto })
  create(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user.sub, dto);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'ORDER_FOUND',
    message: 'Order retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت سفارش' })
  @ApiOkResponse({ type: OrderApiResponseDto })
  findOne(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.sub);
  }
}
