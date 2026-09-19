import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

export class CreateDepositDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  orderId: string;
}

export class RequestDepositDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  orderId: string;

  @ApiProperty({
    enum: ['credit', 'zarinpal', 'zibal', 'loan'],
    description:
      'credit = کیف پول | zarinpal/zibal = درگاه بانکی (IBank) | loan = وام شخص ثالث (ILoan)',
  })
  @IsIn(['credit', 'zarinpal', 'zibal', 'loan'])
  method: 'credit' | 'zarinpal' | 'zibal' | 'loan';
}

export class DepositResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  depositId: string;

  @ApiProperty({ enum: ['zarinpal', 'zibal', 'loan', 'credit'] })
  gateway: string;

  @ApiProperty({ description: 'trackId (درگاه / وام / credit token)' })
  trackId: string;

  @ApiProperty({
    description: 'برای credit خالی است؛ برای درگاه/وام URL هدایت',
  })
  paymentUrl: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingAmount: number;

  @ApiProperty()
  displayTotal: number;

  @ApiPropertyOptional({ type: ShippingMethodResponseDto, nullable: true })
  shippingMethod?: ShippingMethodResponseDto | null;

  @ApiProperty()
  gatewayMessage: string;

  @ApiPropertyOptional({ description: 'موجودی کیف پول بعد از پرداخت credit' })
  creditBalance?: number;
}

export class DepositVerifyResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  depositId: string;

  @ApiProperty({ enum: ['zarinpal', 'zibal', 'loan', 'credit'] })
  gateway: string;

  @ApiProperty()
  refId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingAmount: number;

  @ApiProperty()
  displayTotal: number;

  @ApiPropertyOptional({ type: ShippingMethodResponseDto, nullable: true })
  shippingMethod?: ShippingMethodResponseDto | null;

  @ApiPropertyOptional()
  productName?: string;

  @ApiProperty()
  gatewayMessage: string;

  @ApiPropertyOptional()
  creditBalance?: number;
}

export function toDepositResponse(data: DepositResponseDto): DepositResponseDto {
  return data;
}

export function toDepositVerifyResponse(
  data: DepositVerifyResponseDto,
): DepositVerifyResponseDto {
  return data;
}
