import {
  Body,
  Controller,
  Get,
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
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { Response } from 'express';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ConfigService } from '../config/config.service.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { DepositsService } from './deposits.service.js';
import { DepositResponseDto } from './dto/deposit.dto.js';
import { buildFrontendPaymentCallbackUrl } from './payment-callback.util.js';

class CreateTopUpDto {
  @ApiProperty({ example: 500000, description: 'مبلغ واریز (ریال، عدد صحیح)' })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  amount: number;

  @ApiPropertyOptional({
    enum: ['iBank', 'loan'],
    description: 'درگاه شارژ — پیش‌فرض iBank (زیبال)',
    default: 'iBank',
  })
  @IsOptional()
  @IsIn(['iBank', 'loan'])
  method?: 'iBank' | 'loan';
}

class ListDepositsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: string | number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: string | number;

  @ApiPropertyOptional({ enum: ['pending', 'success', 'failed'] })
  @IsOptional()
  @IsIn(['pending', 'success', 'failed'])
  status?: 'pending' | 'success' | 'failed';

  @ApiPropertyOptional({ description: 'فقط ادمین' })
  @IsOptional()
  userId?: string;
}

class GatewayCallbackQueryDto {
  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @IsString()
  trackId?: string;

  @ApiPropertyOptional({ example: '1', description: '0 یا 1 از درگاه' })
  @IsOptional()
  success?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'کد عددی زیبال — در ریدایرکت فرانت به استرینگ تبدیل می‌شود',
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;
}

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

  @Get('callback/zibal')
  @ApiOperation({
    summary: 'Zibal gateway callback → frontend (string status)',
    description:
      'کال‌بک زیبال: status عددی را به استرینگ (مثل PAYED_ACCEPTED) تبدیل و به ZIBAL_CALLBACK_URL ریدایرکت می‌کند',
  })
  callbackZibal(
    @Query() query: GatewayCallbackQueryDto,
    @Res() res: Response,
  ) {
    const target = buildFrontendPaymentCallbackUrl(
      this.config.get('ZIBAL_CALLBACK_URL'),
      {
        status: query.status,
        trackId: query.trackId,
        success: query.success,
        sourceType: query.sourceType,
        sourceId: query.sourceId,
      },
    );
    return res.redirect(302, target);
  }

  @Get('callback/loan')
  @ApiOperation({
    summary: 'Loan gateway callback → frontend (string status)',
    description:
      'کال‌بک وام: status را استرینگ کرده و به LOAN_CALLBACK_URL ریدایرکت می‌کند',
  })
  callbackLoan(
    @Query() query: GatewayCallbackQueryDto,
    @Res() res: Response,
  ) {
    const target = buildFrontendPaymentCallbackUrl(
      this.config.get('LOAN_CALLBACK_URL'),
      {
        status: query.status,
        trackId: query.trackId,
        success: query.success,
        sourceType: query.sourceType,
        sourceId: query.sourceId,
      },
    );
    return res.redirect(302, target);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMeta({
    code: 'DEPOSIT_CREATED',
    message: 'Deposit created successfully',
  })
  @ApiOperation({
    summary: 'Top-up credit via bank gateway',
    description: 'شارژ اعتبار با درگاه — method: iBank | loan (پیش‌فرض iBank)',
  })
  @ApiOkResponse({ type: TopUpApiResponseDto })
  createTopUp(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateTopUpDto,
  ) {
    return this.depositsService.createWalletTopUp(
      req.user.sub,
      dto.amount,
      dto.method ?? 'iBank',
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
  async listMine(
    @Req() req: { user: { sub: string } },
    @Query() query: ListDepositsQueryDto,
  ) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.depositsService.listDeposits(
      offset,
      limit,
      { userId: req.user.sub, status: query.status },
    );
    return paginatedList(items, page, limit, total);
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
  async listAll(@Query() query: ListDepositsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.depositsService.listDeposits(
      offset,
      limit,
      { userId: query.userId, status: query.status },
    );
    return paginatedList(items, page, limit, total);
  }
}
