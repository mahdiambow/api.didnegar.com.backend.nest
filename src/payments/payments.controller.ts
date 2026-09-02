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
  CreateZarinpalPaymentDto,
  VerifyZarinpalPaymentQueryDto,
  ZarinpalPaymentResponseDto,
  ZarinpalVerifyResponseDto,
} from './dto/zarinpal-payment.dto.js';

const ZarinpalPaymentApiResponseDto = createSuccessResponseDto(
  ZarinpalPaymentResponseDto,
  {
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
    name: 'ZarinpalPayment',
  },
);

const ZarinpalVerifyApiResponseDto = createSuccessResponseDto(
  ZarinpalVerifyResponseDto,
  {
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
    name: 'ZarinpalVerify',
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
  @ApiOkResponse({ type: ZarinpalPaymentApiResponseDto })
  requestPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateZarinpalPaymentDto,
  ) {
    return this.paymentsService.createZarinpalPayment(req.user.sub, dto);
  }

  @Get('zarinpal/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({ summary: 'تأیید پرداخت زرین‌پال (mock callback)' })
  @ApiOkResponse({ type: ZarinpalVerifyApiResponseDto })
  verifyPayment(@Query() query: VerifyZarinpalPaymentQueryDto) {
    return this.paymentsService.verifyZarinpalPayment(
      query.Authority,
      query.Status,
    );
  }
}
