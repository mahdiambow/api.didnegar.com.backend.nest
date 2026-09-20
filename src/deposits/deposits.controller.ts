import {
  Body,
  Controller,
  HttpStatus,
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
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { DepositsService } from './deposits.service.js';
import {
  DepositResponseDto,
  RequestDepositDto,
} from './dto/deposit.dto.js';

const DepositApiResponseDto = createSuccessResponseDto(DepositResponseDto, {
  code: 'PAYMENT_REQUESTED',
  message: 'Payment request created successfully',
  name: 'Deposit',
});

@ApiTags('Deposits')
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post('request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({
    summary: 'Request order payment',
    description:
      'درخواست پرداخت سفارش\n\nuserId از JWT. method: credit | iBank | loan. iBank = درگاه بانکی (زیبال).',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
  requestPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: RequestDepositDto,
  ) {
    return this.depositsService.requestPayment(
      req.user.sub,
      this.requireOrderId(dto.orderId),
      dto.method,
    );
  }

  private requireOrderId(orderId?: string): string {
    if (!orderId) {
      throw new ApiException(
        'ORDER_ID_REQUIRED',
        'orderId برای پرداخت سفارش الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }
    return orderId;
  }
}
