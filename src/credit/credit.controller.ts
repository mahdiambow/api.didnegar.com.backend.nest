import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { CreditService } from './credit.service.js';

class CreditBalanceDto {
  @ApiProperty({ example: 1500000 })
  balance: number;
}

const CreditBalanceApiResponseDto = createSuccessResponseDto(CreditBalanceDto, {
  code: 'CREDIT_BALANCE_FOUND',
  message: 'Credit balance retrieved successfully',
  name: 'CreditBalance',
});

@ApiTags('Credit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  @ApiResponseMeta({
    code: 'CREDIT_BALANCE_FOUND',
    message: 'Credit balance retrieved successfully',
  })
  @ApiOperation({ summary: 'موجودی کیف پول کاربر' })
  @ApiOkResponse({ type: CreditBalanceApiResponseDto })
  async getBalance(@Req() req: { user: { sub: string } }) {
    const balance = await this.creditService.getBalance(req.user.sub);
    return { balance };
  }
}
