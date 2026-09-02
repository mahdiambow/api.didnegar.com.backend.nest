import {
  Body,
  Controller,
  Get,
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
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PaymentsService } from './payments.service.js';
import {
  PaymentResponseDto,
  PaymentVerifyResponseDto,
} from './dto/payment.dto.js';
import {
  CreateZarinpalPaymentDto,
  VerifyZarinpalPaymentQueryDto,
} from './dto/zarinpal-payment.dto.js';
import { CreatePaymentDto } from './dto/payment.dto.js';
import { VerifyZibalPaymentQueryDto } from './dto/zibal-payment.dto.js';

const PaymentApiResponseDto = createSuccessResponseDto(PaymentResponseDto, {
  code: 'PAYMENT_REQUESTED',
  message: 'Payment request created successfully',
  name: 'Payment',
});

const PaymentVerifyApiResponseDto = createSuccessResponseDto(
  PaymentVerifyResponseDto,
  {
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
    name: 'PaymentVerify',
  },
);

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('zarinpal/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({ summary: 'درخواست پرداخت زرین‌پال (mock)' })
  @ApiOkResponse({ type: PaymentApiResponseDto })
  requestZarinpalPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateZarinpalPaymentDto,
  ) {
    return this.paymentsService.createZarinpalPayment(req.user.sub, dto.orderId);
  }

  @Get('zarinpal/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({ summary: 'تأیید پرداخت زرین‌پال (mock callback)' })
  @ApiOkResponse({ type: PaymentVerifyApiResponseDto })
  verifyZarinpalPayment(@Query() query: VerifyZarinpalPaymentQueryDto) {
    return this.paymentsService.verifyZarinpalPayment(
      query.Authority,
      query.Status,
    );
  }

  @Post('zibal/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({ summary: 'درخواست پرداخت زیبال (mock)' })
  @ApiOkResponse({ type: PaymentApiResponseDto })
  requestZibalPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createZibalPayment(req.user.sub, dto.orderId);
  }

  @Get('zibal/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({ summary: 'تأیید پرداخت زیبال (mock callback)' })
  @ApiOkResponse({ type: PaymentVerifyApiResponseDto })
  verifyZibalPayment(@Query() query: VerifyZibalPaymentQueryDto) {
    return this.paymentsService.verifyZibalPayment(
      query.trackId,
      query.success,
    );
  }
}
