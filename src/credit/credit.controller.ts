import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { CreditService } from './credit.service.js';
import {
  CreditBalanceDto,
  ListCreditsQueryDto,
  toCreditItem,
} from './dto/credit.dto.js';

const BalanceApiDto = createSuccessResponseDto(CreditBalanceDto, {
  code: 'CREDIT_BALANCE_FOUND',
  message: 'Credit balance retrieved successfully',
  name: 'CreditBalance',
});

@ApiTags('Credits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('me')
  @ApiResponseMeta({
    code: 'CREDIT_BALANCE_FOUND',
    message: 'Credit balance retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get my credit balance',
    description: 'موجودی و مبلغ قفل‌شده اعتبار کاربر',
  })
  @ApiOkResponse({ type: BalanceApiDto })
  getMyBalance(@Req() req: { user: { sub: string } }) {
    return this.creditService.getBalance(req.user.sub);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.credit.read)
  @ApiResponseMeta({
    code: 'CREDITS_LISTED',
    message: 'Credits listed successfully',
  })
  @ApiOperation({
    summary: 'List user credits (admin)',
    description: 'لیست اعتبار کاربران',
  })
  async list(@Query() query: ListCreditsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.creditService.findPaginated(
      offset,
      limit,
      { userId: query.userId },
    );
    return paginatedList(items.map(toCreditItem), page, limit, total);
  }
}
