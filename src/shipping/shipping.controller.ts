import {
  Get,
  Query,
  Controller,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ShippingService } from './shipping.service.js';
import {
  ShippingQuoteQueryDto,
  ShippingQuoteResponseDto,
} from './dto/shipping.dto.js';

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
}
