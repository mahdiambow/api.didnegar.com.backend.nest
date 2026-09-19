import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
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
import type { Response } from 'express';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { ConfigService } from '../config/config.service.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { DepositsService } from './deposits.service.js';
import {
  CreateDepositDto,
  CreateTopUpDto,
  DepositResponseDto,
  ListDepositsQueryDto,
  RequestDepositDto,
} from './dto/deposit.dto.js';
import {
  CreateZarinpalPaymentDto,
  VerifyZarinpalPaymentQueryDto,
} from './dto/zarinpal-deposit.dto.js';
import { VerifyZibalPaymentQueryDto } from './dto/zibal-deposit.dto.js';

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

const TopUpApiResponseDto = createSuccessResponseDto(DepositResponseDto, {
  code: 'DEPOSIT_CREATED',
  message: 'Deposit created successfully',
  name: 'DepositTopUp',
});

@ApiTags('Deposits')
@Controller('deposits')
export class DepositsController {
  constructor(
    private readonly depositsService: DepositsService,
    private readonly config: ConfigService,
  ) {}

  // ─── REST collection ───────────────────────────────────

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'DEPOSIT_CREATED',
    message: 'Deposit created successfully',
  })
  @ApiOperation({
    summary: 'Create deposit (top-up credit)',
    description:
      'شارژ اعتبار از طریق درگاه. در حالت mock، verify به‌صورت کال‌بک داخلی بک‌اند انجام می‌شود و اعتبار بلافاصله شارژ می‌شود.',
  })
  @ApiOkResponse({ type: TopUpApiResponseDto })
  createTopUp(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateTopUpDto,
  ) {
    return this.depositsService.createTopUp(
      req.user.sub,
      dto.amount,
      dto.method,
    );
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'DEPOSITS_LISTED',
    message: 'Deposits listed successfully',
  })
  @ApiOperation({
    summary: 'List my deposits',
    description: 'لیست واریزهای من',
  })
  listMine(
    @Req() req: { user: { sub: string } },
    @Query() query: ListDepositsQueryDto,
  ) {
    return this.depositsService.listDepositsPaged(query, req.user.sub);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.deposits.read)
  @ApiResponseMeta({
    code: 'DEPOSITS_LISTED',
    message: 'Deposits listed successfully',
  })
  @ApiOperation({
    summary: 'List deposits (admin)',
    description: 'لیست همه واریزها',
  })
  listAll(@Query() query: ListDepositsQueryDto) {
    return this.depositsService.listDepositsPaged(query);
  }

  // ─── Order payment / gateways ──────────────────────────

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
      'درخواست پرداخت سفارش\n\nuserId از JWT. method: credit | zarinpal | zibal | loan.',
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
    return this.depositsService.createZarinpalPayment(
      req.user.sub,
      this.requireOrderId(dto.orderId),
    );
  }

  @Get('zarinpal/verify')
  @ApiOperation({
    summary: 'Zarinpal callback — verify then redirect frontend',
    description:
      'کال‌بک زرین‌پال: verify سپس ریدایرکت به PAYMENT_SUCCESS/FAILED_REDIRECT_URL',
  })
  async verifyZarinpalPayment(
    @Query() query: VerifyZarinpalPaymentQueryDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.depositsService.verifyZarinpalPayment(
        query.Authority,
        query.Status,
      );
      return this.redirectPaymentResult(res, true, data);
    } catch {
      return this.redirectPaymentResult(res, false);
    }
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
    return this.depositsService.createZibalPayment(
      req.user.sub,
      this.requireOrderId(dto.orderId),
    );
  }

  @Get('zibal/verify')
  @ApiOperation({
    summary: 'Zibal callback — verify then redirect frontend',
    description:
      'کال‌بک زیبال: verify سپس ریدایرکت به PAYMENT_SUCCESS/FAILED_REDIRECT_URL',
  })
  async verifyZibalPayment(
    @Query() query: VerifyZibalPaymentQueryDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.depositsService.verifyZibalPayment(
        query.trackId,
        query.success,
        query.status,
      );
      return this.redirectPaymentResult(res, true, data);
    } catch {
      return this.redirectPaymentResult(res, false);
    }
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
    return this.depositsService.createLoanPayment(
      req.user.sub,
      this.requireOrderId(dto.orderId),
    );
  }

  @Get('loan/verify')
  @ApiOperation({
    summary: 'Loan callback — verify then redirect frontend',
    description:
      'کال‌بک وام: verify سپس ریدایرکت به PAYMENT_SUCCESS/FAILED_REDIRECT_URL',
  })
  async verifyLoanPayment(
    @Query() query: VerifyLoanPaymentQueryDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.depositsService.verifyLoanPayment(
        query.trackId,
        query.success,
      );
      return this.redirectPaymentResult(res, true, data);
    } catch {
      return this.redirectPaymentResult(res, false);
    }
  }

  @Post('credit/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'PAYMENT_REQUESTED',
    message: 'Payment request created successfully',
  })
  @ApiOperation({
    summary: 'Pay directly from credit',
    description:
      'پرداخت مستقیم از اعتبار — بدون درگاه؛ paymentUrl خالی است. برای sandbox از zarinpal/zibal استفاده کنید.',
  })
  @ApiOkResponse({ type: DepositApiResponseDto })
  requestCreditPayment(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateDepositDto,
  ) {
    return this.depositsService.createCreditPayment(
      req.user.sub,
      this.requireOrderId(dto.orderId),
    );
  }

  /** ریدایرکت مرورگر به فرانت بعد از کال‌بک درگاه */
  private redirectPaymentResult(
    res: Response,
    ok: boolean,
    data?: {
      orderId?: string | null;
      depositId?: string;
      amount?: number;
      refId?: string;
    },
  ) {
    const base = this.config.get(
      ok ? 'PAYMENT_SUCCESS_REDIRECT_URL' : 'PAYMENT_FAILED_REDIRECT_URL',
    );
    const url = new URL(base);
    if (data?.orderId) url.searchParams.set('orderId', data.orderId);
    if (data?.depositId) url.searchParams.set('depositId', data.depositId);
    if (data?.amount != null) {
      url.searchParams.set('amount', String(data.amount));
    }
    if (data?.refId) url.searchParams.set('refId', data.refId);
    return res.redirect(302, url.toString());
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
