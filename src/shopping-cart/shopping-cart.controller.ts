import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { OrdersService } from '../orders/orders.service.js';
import { OrderResponseDto } from '../orders/dto/order-response.dto.js';
import {
  AddShoppingCartItemDto,
  ShoppingCartResponseDto,
  UpdateShoppingCartItemDto,
} from './dto/shopping-cart.dto.js';
import { CheckoutCartDto } from './dto/checkout-cart.dto.js';
import { ShoppingCartService } from './shopping-cart.service.js';

const CartApiResponseDto = createSuccessResponseDto(ShoppingCartResponseDto, {
  code: 'SHOPPING_CART_FOUND',
  message: 'Shopping cart retrieved successfully',
  name: 'ShoppingCart',
});

const OrderApiResponseDto = createSuccessResponseDto(OrderResponseDto, {
  code: 'ORDER_CREATED',
  message: 'Order created from cart successfully',
  name: 'CheckoutOrder',
});

@ApiTags('Shopping Cart')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('shopping-cart')
export class ShoppingCartController {
  constructor(
    private readonly shoppingCartService: ShoppingCartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  @ApiResponseMeta({
    code: 'SHOPPING_CART_FOUND',
    message: 'Shopping cart retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت سبد خرید کاربر' })
  @ApiOkResponse({ type: CartApiResponseDto })
  get(@Req() req: { user: { sub: string } }) {
    return this.shoppingCartService.get(req.user.sub);
  }

  @Post('checkout')
  @ApiResponseMeta({
    code: 'ORDER_CREATED',
    message: 'Order created from cart successfully',
  })
  @ApiOperation({
    summary: 'تسویه سبد خرید و ساخت سفارش از آیتم‌های سبد',
    description:
      'order-itemها از shopping-cart-item ساخته می‌شوند. addressId و shippingMethodIds الزامی است.',
  })
  @ApiOkResponse({ type: OrderApiResponseDto })
  checkout(
    @Req() req: { user: { sub: string } },
    @Body() dto: CheckoutCartDto,
  ) {
    return this.ordersService.checkoutFromCart(req.user.sub, dto);
  }

  @Post('items')
  @ApiResponseMeta({
    code: 'SHOPPING_CART_ITEM_ADDED',
    message: 'Shopping cart item added successfully',
  })
  @ApiOperation({ summary: 'افزودن پیشنهاد فروش به سبد خرید' })
  @ApiOkResponse({ type: CartApiResponseDto })
  addItem(
    @Req() req: { user: { sub: string } },
    @Body() dto: AddShoppingCartItemDto,
  ) {
    return this.shoppingCartService.addItem(req.user.sub, dto);
  }

  @Patch('items/:id')
  @ApiResponseMeta({
    code: 'SHOPPING_CART_ITEM_UPDATED',
    message: 'Shopping cart item updated successfully',
  })
  @ApiOperation({ summary: 'تغییر تعداد آیتم سبد خرید' })
  @ApiOkResponse({ type: CartApiResponseDto })
  updateItem(
    @Req() req: { user: { sub: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShoppingCartItemDto,
  ) {
    return this.shoppingCartService.updateItem(req.user.sub, id, dto);
  }

  @Delete('items/:id')
  @ApiResponseMeta({
    code: 'SHOPPING_CART_ITEM_REMOVED',
    message: 'Shopping cart item removed successfully',
  })
  @ApiOperation({ summary: 'حذف آیتم از سبد خرید' })
  @ApiOkResponse({ type: CartApiResponseDto })
  removeItem(
    @Req() req: { user: { sub: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shoppingCartService.removeItem(req.user.sub, id);
  }

  @Delete('items')
  @ApiResponseMeta({
    code: 'SHOPPING_CART_CLEARED',
    message: 'Shopping cart cleared successfully',
  })
  @ApiOperation({ summary: 'خالی کردن سبد خرید' })
  @ApiOkResponse({ type: CartApiResponseDto })
  clear(@Req() req: { user: { sub: string } }) {
    return this.shoppingCartService.clear(req.user.sub);
  }
}
