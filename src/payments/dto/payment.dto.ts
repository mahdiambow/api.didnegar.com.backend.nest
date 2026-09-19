import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

export class CreatePaymentDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  orderId: string;
}

export class RequestPaymentDto {
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

export class PaymentResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty({ enum: ['zarinpal', 'zibal', 'loan', 'credit'] })
  gateway: string;

  @ApiProperty({ description: 'authority / trackId / credit token' })
  authority: string;

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

export class PaymentVerifyResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

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

export function toPaymentResponse(data: PaymentResponseDto): PaymentResponseDto {
  return data;
}

export function toPaymentVerifyResponse(
  data: PaymentVerifyResponseDto,
): PaymentVerifyResponseDto {
  return data;
}
