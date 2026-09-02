import {
  Body,
  Controller,
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
import { PERMISSIONS } from '../roles/permissions.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';

const OrderApiResponseDto = createSuccessResponseDto(OrderResponseDto, {
  code: 'ORDER_FOUND',
  message: 'Order retrieved successfully',
  name: 'Order',
});

const OrdersPaginatedApiResponseDto = createPaginatedResponseDto(
  OrderResponseDto,
  {
    code: 'ORDERS_FOUND',
    message: 'Orders retrieved successfully',
    name: 'Orders',
  },
);

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.orders.read)
  @ApiResponseMeta({
    code: 'ORDERS_FOUND',
    message: 'Orders retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست سفارش‌ها (ادمین)' })
  @ApiOkResponse({ type: OrdersPaginatedApiResponseDto })
  findAll(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

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

  @Get('admin/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.orders.read)
  @ApiResponseMeta({
    code: 'ORDER_FOUND',
    message: 'Order retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت سفارش (ادمین)' })
  @ApiOkResponse({ type: OrderApiResponseDto })
  findOneAdmin(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.orders.update)
  @ApiResponseMeta({
    code: 'ORDER_UPDATED',
    message: 'Order updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش سفارش (ادمین)' })
  @ApiOkResponse({ type: OrderApiResponseDto })
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateAdmin(id, dto);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'ORDER_FOUND',
    message: 'Order retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت سفارش کاربر' })
  @ApiOkResponse({ type: OrderApiResponseDto })
  findOne(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.sub);
  }
}
