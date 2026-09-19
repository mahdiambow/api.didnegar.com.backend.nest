import {
  Body,
  Controller,
  Get,
  Param,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { ConfigService } from '../config/config.service.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { DepositsService } from './deposits.service.js';
import {
  DepositMethod,
  isDepositGatewayMethod,
} from './deposit-method.enum.js';
import {
  CreateTopUpDto,
  DepositResponseDto,
  ListDepositsQueryDto,
  VerifyDepositQueryDto,
} from './dto/deposit.dto.js';

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

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'DEPOSIT_CREATED',
    message: 'Deposit created successfully',
  })
  @ApiOperation({
    summary: 'Top-up credit via bank gateway',
    description:
      'فقط شارژ اعتبار با درگاه بانکی. body: amount + paymentMethod (zarinpal|zibal). پاسخ شامل paymentUrl است.',
  })
  @ApiOkResponse({ type: TopUpApiResponseDto })
  createTopUp(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateTopUpDto,
  ) {
    return this.depositsService.createTopUp(
      req.user.sub,
      dto.amount,
      dto.paymentMethod,
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

  @Get('verify/:method')
  @ApiParam({ name: 'method', enum: DepositMethod })
  @ApiOperation({
    summary: 'Gateway callback — verify then redirect frontend',
    description:
      'کال‌بک درگاه‌ها (zarinpal|zibal|loan) سپس ریدایرکت به success/failed',
  })
  async verify(
    @Param('method') method: string,
    @Query() query: VerifyDepositQueryDto,
    @Res() res: Response,
  ) {
    if (
      !Object.values(DepositMethod).includes(method as DepositMethod) ||
      method === DepositMethod.CREDIT ||
      !isDepositGatewayMethod(method as DepositMethod)
    ) {
      return this.redirectPaymentResult(res, false);
    }

    try {
      const data = await this.depositsService.verifyByMethod(
        method as DepositMethod,
        query,
      );
      return this.redirectPaymentResult(res, true, data);
    } catch {
      return this.redirectPaymentResult(res, false);
    }
  }

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
}
