import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { TransactionService } from './transaction.service.js';
import {
  ListTransactionsQueryDto,
  toTransactionItem,
} from './dto/transaction.dto.js';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('me')
  @ApiResponseMeta({
    code: 'TRANSACTIONS_LISTED',
    message: 'Transactions listed successfully',
  })
  @ApiOperation({
    summary: 'List my transactions',
    description: 'لیست تراکنش‌های مالی من',
  })
  async listMine(
    @Req() req: { user: { sub: string } },
    @Query() query: ListTransactionsQueryDto,
  ) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.transactionService.findPaginated(
      offset,
      limit,
      {
        userId: req.user.sub,
        state: query.state,
        sourceType: query.sourceType,
        orderId: query.orderId,
      },
    );
    return paginatedList(items.map(toTransactionItem), page, limit, total);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.transactions.read)
  @ApiResponseMeta({
    code: 'TRANSACTIONS_LISTED',
    message: 'Transactions listed successfully',
  })
  @ApiOperation({
    summary: 'List transactions (admin)',
    description: 'لیست همه تراکنش‌های مالی',
  })
  async listAll(@Query() query: ListTransactionsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.transactionService.findPaginated(
      offset,
      limit,
      {
        userId: query.userId,
        state: query.state,
        sourceType: query.sourceType,
        orderId: query.orderId,
      },
    );
    return paginatedList(items.map(toTransactionItem), page, limit, total);
  }
}
