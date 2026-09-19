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
import { WithdrawsService } from './withdraws.service.js';
import {
  CreateWithdrawDto,
  ListWithdrawsQueryDto,
  ReviewWithdrawDto,
  WithdrawItemDto,
} from './dto/withdraw.dto.js';

const WithdrawApiDto = createSuccessResponseDto(WithdrawItemDto, {
  code: 'WITHDRAW_CREATED',
  message: 'Withdraw request created successfully',
  name: 'Withdraw',
});

@ApiTags('Withdraws')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('withdraws')
export class WithdrawsController {
  constructor(private readonly withdrawsService: WithdrawsService) {}

  @Post()
  @ApiResponseMeta({
    code: 'WITHDRAW_CREATED',
    message: 'Withdraw request created successfully',
  })
  @ApiOperation({
    summary: 'Request withdraw',
    description: 'درخواست برداشت — مبلغ تا تأیید ادمین قفل می‌شود',
  })
  @ApiOkResponse({ type: WithdrawApiDto })
  create(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateWithdrawDto,
  ) {
    return this.withdrawsService.create(req.user.sub, dto);
  }

  @Get('me')
  @ApiResponseMeta({
    code: 'WITHDRAWS_LISTED',
    message: 'Withdraws listed successfully',
  })
  @ApiOperation({
    summary: 'List my withdraws',
    description: 'لیست برداشت‌های من',
  })
  listMine(
    @Req() req: { user: { sub: string } },
    @Query() query: ListWithdrawsQueryDto,
  ) {
    return this.withdrawsService.listPaged(query, req.user.sub);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.withdraws.read)
  @ApiResponseMeta({
    code: 'WITHDRAWS_LISTED',
    message: 'Withdraws listed successfully',
  })
  @ApiOperation({
    summary: 'List withdraws (admin)',
    description: 'لیست همه برداشت‌ها',
  })
  listAll(@Query() query: ListWithdrawsQueryDto) {
    return this.withdrawsService.listPaged(query);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.withdraws.update)
  @ApiResponseMeta({
    code: 'WITHDRAW_REVIEWED',
    message: 'Withdraw reviewed successfully',
  })
  @ApiOperation({
    summary: 'Approve or reject withdraw (admin)',
    description: 'تأیید یا رد درخواست برداشت',
  })
  @ApiOkResponse({ type: WithdrawApiDto })
  review(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: ReviewWithdrawDto,
  ) {
    return this.withdrawsService.review(id, dto.action);
  }
}
