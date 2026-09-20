import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { DepositsService } from './deposits.service.js';
import {
  DepositResponseDto,
  RequestDepositDto,
} from './dto/deposit.dto.js';

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
  constructor(private readonly depositsService: DepositsService) {}

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
