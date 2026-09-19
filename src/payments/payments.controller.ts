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
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PaymentsService } from './payments.service.js';
import {
  CreateDepositDto,
  DepositResponseDto,
  DepositVerifyResponseDto,
  RequestDepositDto,
} from './dto/payment.dto.js';
import {
  CreateZarinpalPaymentDto,
  VerifyZarinpalPaymentQueryDto,
} from './dto/zarinpal-payment.dto.js';
import { VerifyZibalPaymentQueryDto } from './dto/zibal-payment.dto.js';

class VerifyLoanPaymentQueryDto {
  @ApiProperty()
  @IsString()
  trackId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  success: number;
}

const DepositApiResponseDto = createSuccessResponseDto(DepositResponseDto, {
  code: 'PAYMENT_REQUESTED',
  message: 'Payment request created successfully',
  name: 'Deposit',
});

const DepositVerifyApiResponseDto = createSuccessResponseDto(
  DepositVerifyResponseDto,
  {
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
    name: 'DepositVerify',
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
    summary: 'Request order payment',
    description:
      'درخواست پرداخت سفارش\n\nuserId از JWT. method: credit | zarinpal | zibal | loan. در موفقیت درگاه، ابتدا credit شارژ و سپس کسر می‌شود.',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
  requestPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: RequestDepositDto,
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
  @ApiOperation({
    summary: 'Request Zarinpal payment (IBank mock)',
    description: 'درخواست پرداخت زرین‌پال (IBank mock)',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
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
    summary: 'Confirm Zarinpal — deposit then charge from credit',
    description: 'تأیید زرین‌پال — deposit سپس charge از credit',
  })
  @ApiOkResponse({ type: DepositVerifyApiResponseDto })
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
  @ApiOperation({
    summary: 'Request Zibal payment (IBank mock)',
    description: 'درخواست پرداخت زیبال (IBank mock)',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
  requestZibalPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateDepositDto,
  ) {
    return this.paymentsService.createZibalPayment(req.user.sub, dto.orderId);
  }

  @Get('zibal/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({
    summary: 'Confirm Zibal — deposit then charge from credit',
    description: 'تأیید زیبال — deposit سپس charge از credit',
  })
  @ApiOkResponse({ type: DepositVerifyApiResponseDto })
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
  @ApiOperation({
    summary: 'Request loan payment (ILoan mock)',
    description: 'درخواست پرداخت وام (ILoan mock)',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
  requestLoanPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateDepositDto,
  ) {
    return this.paymentsService.createLoanPayment(req.user.sub, dto.orderId);
  }

  @Get('loan/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({
    summary: 'Confirm loan — deposit then charge from credit',
    description: 'تأیید وام — deposit سپس charge از credit',
  })
  @ApiOkResponse({ type: DepositVerifyApiResponseDto })
  verifyLoanPayment(@Query() query: VerifyLoanPaymentQueryDto) {
    return this.paymentsService.verifyLoanPayment(query.trackId, query.success);
  }

  @Post('credit/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({
    summary: 'Pay directly from wallet (credit)',
    description: 'پرداخت مستقیم از کیف پول (credit)',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
  requestCreditPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateDepositDto,
  ) {
    return this.paymentsService.createCreditPayment(req.user.sub, dto.orderId);
  }
}
