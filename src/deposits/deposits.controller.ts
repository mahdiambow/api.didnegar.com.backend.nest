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
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { DepositsService } from './deposits.service.js';
import {
  DepositResponseDto,
  DepositVerifyResponseDto,
  RequestDepositDto,
} from './dto/deposit.dto.js';
import { VerifyIBankPaymentQueryDto } from './dto/ibank-deposit.dto.js';

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

@ApiTags('Deposits')
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

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
      'درخواست پرداخت سفارش\n\nuserId از JWT. method: credit | iBank | loan. iBank = درگاه بانکی (زیبال). در موفقیت درگاه، ابتدا credit شارژ و سپس کسر می‌شود.',
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

  @Get('iBank/verify')
  @ApiResponseMeta({
    code: 'PAYMENT_VERIFIED',
    message: 'Payment verified successfully',
  })
  @ApiOperation({
    summary: 'Verify iBank (Zibal) callback then POST /v1/verify',
    description:
      'Callback درگاه بانکی (زیبال): success=1 و status=2 → POST gateway.zibal.ir/v1/verify',
  })
  @ApiOkResponse({ type: DepositVerifyApiResponseDto })
  verifyIBankPayment(@Query() query: VerifyIBankPaymentQueryDto) {
    return this.depositsService.verifyIBankPayment(
      query.trackId,
      query.success,
      query.status,
    );
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
    return this.depositsService.verifyLoanPayment(query.trackId, query.success);
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
