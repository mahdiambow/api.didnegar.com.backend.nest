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
  RequestPaymentDto,
  CreatePaymentDto,
} from './dto/payment.dto.js';
import {
  CreateZarinpalPaymentDto,
  VerifyZarinpalPaymentQueryDto,
} from './dto/zarinpal-payment.dto.js';
import { VerifyZibalPaymentQueryDto } from './dto/zibal-payment.dto.js';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

class VerifyLoanPaymentQueryDto {
  @ApiProperty()
  @IsString()
  authority: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  success: number;
}

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

  @Post('request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({
    summary: 'درخواست پرداخت سفارش',
    description:
      'userId از JWT. method: credit | zarinpal | zibal | loan. در موفقیت درگاه، ابتدا credit شارژ و سپس کسر می‌شود.',
  })
  @ApiOkResponse({ type: PaymentApiResponseDto })
  requestPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: RequestPaymentDto,
  ) {
    return this.paymentsService.requestPayment(
      req.user.sub,
      dto.orderId,
      dto.method,
    );
  }

  @Post('zarinpal/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({ summary: 'درخواست پرداخت زرین‌پال (IBank mock)' })
  @ApiOkResponse({ type: PaymentApiResponseDto })
  requestZarinpalPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateZarinpalPaymentDto,
  ) {
    return this.paymentsService.createZarinpalPayment(
      req.user.sub,
      dto.orderId,
    );
  }

  @Get('zarinpal/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({
    summary: 'تأیید زرین‌پال — deposit سپس charge از credit',
  })
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
  @ApiOperation({ summary: 'درخواست پرداخت زیبال (IBank mock)' })
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
  @ApiOperation({
    summary: 'تأیید زیبال — deposit سپس charge از credit',
  })
  @ApiOkResponse({ type: PaymentVerifyApiResponseDto })
  verifyZibalPayment(@Query() query: VerifyZibalPaymentQueryDto) {
    return this.paymentsService.verifyZibalPayment(
      query.trackId,
      query.success,
    );
  }

  @Post('loan/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({ summary: 'درخواست پرداخت وام (ILoan mock)' })
  @ApiOkResponse({ type: PaymentApiResponseDto })
  requestLoanPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createLoanPayment(req.user.sub, dto.orderId);
  }

  @Get('loan/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({
    summary: 'تأیید وام — deposit سپس charge از credit',
  })
  @ApiOkResponse({ type: PaymentVerifyApiResponseDto })
  verifyLoanPayment(@Query() query: VerifyLoanPaymentQueryDto) {
    return this.paymentsService.verifyLoanPayment(
      query.authority,
      query.success,
    );
  }

  @Post('credit/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({ summary: 'پرداخت مستقیم از کیف پول (credit)' })
  @ApiOkResponse({ type: PaymentApiResponseDto })
  requestCreditPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createCreditPayment(req.user.sub, dto.orderId);
  }
}
