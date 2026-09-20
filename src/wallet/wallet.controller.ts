import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { ParseULIDPipe } from '../common/id/index.js';
import { WalletService } from './wallet.service.js';
import {
  CreateWalletDepositDto,
  CreateWalletWithdrawDto,
  ListWalletQueryDto,
  ReviewWithdrawDto,
  WalletBalanceDto,
  WalletWithdrawItemDto,
} from './dto/wallet.dto.js';
import { DepositResponseDto } from '../deposits/dto/deposit.dto.js';

const BalanceApiDto = createSuccessResponseDto(WalletBalanceDto, {
  code: 'WALLET_BALANCE_FOUND',
  message: 'Wallet balance retrieved successfully',
  name: 'WalletBalance',
});

const DepositRequestApiDto = createSuccessResponseDto(DepositResponseDto, {
  code: 'WALLET_DEPOSIT_REQUESTED',
  message: 'Wallet deposit requested successfully',
  name: 'WalletDepositRequest',
});

const WithdrawItemApiDto = createSuccessResponseDto(WalletWithdrawItemDto, {
  code: 'WALLET_WITHDRAW_CREATED',
  message: 'Withdraw request created successfully',
  name: 'WalletWithdraw',
});

@ApiTags('Wallet')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ─── User ───────────────────────────────────────────────

  @Get('balance')
  @ApiResponseMeta({
    code: 'WALLET_BALANCE_FOUND',
    message: 'Wallet balance retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get my wallet balance',
    description: 'موجودی و مبلغ قفل‌شده کیف پول کاربر',
  })
  @ApiOkResponse({ type: BalanceApiDto })
  getBalance(@Req() req: { user: { sub: string } }) {
    return this.walletService.getBalance(req.user.sub);
  }

  @Post('deposits')
  @ApiResponseMeta({
    code: 'WALLET_DEPOSIT_REQUESTED',
    message: 'Wallet deposit requested successfully',
  })
  @ApiOperation({
    summary: 'Charge wallet via gateway',
    description: 'درخواست شارژ کیف پول از طریق iBank / زیبال (بدون سفارش)',
  })
  @ApiOkResponse({ type: DepositRequestApiDto })
  createDeposit(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateWalletDepositDto,
  ) {
    return this.walletService.createDeposit(req.user.sub, dto);
  }

  @Get('deposits')
  @ApiResponseMeta({
    code: 'WALLET_DEPOSITS_LISTED',
    message: 'Wallet deposits listed successfully',
  })
  @ApiOperation({
    summary: 'List my deposits',
    description: 'لیست واریزهای کیف پول من',
  })
  listMyDeposits(
    @Req() req: { user: { sub: string } },
    @Query() query: ListWalletQueryDto,
  ) {
    return this.walletService.listMyDeposits(req.user.sub, query);
  }

  @Post('withdraws')
  @ApiResponseMeta({
    code: 'WALLET_WITHDRAW_CREATED',
    message: 'Withdraw request created successfully',
  })
  @ApiOperation({
    summary: 'Request withdraw',
    description:
      'درخواست برداشت — مبلغ تا تأیید ادمین قفل می‌شود',
  })
  @ApiOkResponse({ type: WithdrawItemApiDto })
  createWithdraw(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateWalletWithdrawDto,
  ) {
    return this.walletService.createWithdraw(req.user.sub, dto);
  }

  @Get('withdraws')
  @ApiResponseMeta({
    code: 'WALLET_WITHDRAWS_LISTED',
    message: 'Wallet withdraws listed successfully',
  })
  @ApiOperation({
    summary: 'List my withdraws',
    description: 'لیست برداشت‌های من',
  })
  listMyWithdraws(
    @Req() req: { user: { sub: string } },
    @Query() query: ListWalletQueryDto,
  ) {
    return this.walletService.listMyWithdraws(req.user.sub, query);
  }

  // ─── Admin ──────────────────────────────────────────────

  @Get('admin')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.wallet.read)
  @ApiResponseMeta({
    code: 'WALLETS_LISTED',
    message: 'Wallets listed successfully',
  })
  @ApiOperation({
    summary: 'Admin: list user wallets',
    description: 'لیست کیف‌پول‌های ساخته‌شده برای کاربران',
  })
  listWalletsAdmin(@Query() query: ListWalletQueryDto) {
    return this.walletService.listWalletsAdmin(query);
  }

  @Get('admin/deposits')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.wallet.read)
  @ApiResponseMeta({
    code: 'WALLET_DEPOSITS_LISTED',
    message: 'Wallet deposits listed successfully',
  })
  @ApiOperation({
    summary: 'Admin: list all deposits',
    description: 'لیست همه واریزها (ادمین)',
  })
  listDepositsAdmin(@Query() query: ListWalletQueryDto) {
    return this.walletService.listDepositsAdmin(query);
  }

  @Get('admin/withdraws')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.wallet.read)
  @ApiResponseMeta({
    code: 'WALLET_WITHDRAWS_LISTED',
    message: 'Wallet withdraws listed successfully',
  })
  @ApiOperation({
    summary: 'Admin: list all withdraws',
    description: 'لیست همه برداشت‌ها (ادمین)',
  })
  listWithdrawsAdmin(@Query() query: ListWalletQueryDto) {
    return this.walletService.listWithdrawsAdmin(query);
  }

  @Patch('admin/withdraws/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.wallet.update)
  @ApiResponseMeta({
    code: 'WALLET_WITHDRAW_REVIEWED',
    message: 'Withdraw reviewed successfully',
  })
  @ApiOperation({
    summary: 'Admin: approve or reject withdraw',
    description: 'تأیید یا رد درخواست برداشت',
  })
  @ApiOkResponse({ type: WithdrawItemApiDto })
  reviewWithdraw(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: ReviewWithdrawDto,
  ) {
    return this.walletService.reviewWithdraw(id, dto.action);
  }
}
