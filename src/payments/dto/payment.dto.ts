import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

export class CreatePaymentDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  orderId: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty({ enum: ['zarinpal', 'zibal'] })
  gateway: string;

  @ApiProperty({ description: 'authority (زرین‌پال) یا trackId (زیبال)' })
  authority: string;

  @ApiProperty()
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
}

export class PaymentVerifyResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty({ enum: ['zarinpal', 'zibal'] })
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
}

export function toPaymentResponse(data: PaymentResponseDto): PaymentResponseDto {
  return data;
}

export function toPaymentVerifyResponse(
  data: PaymentVerifyResponseDto,
): PaymentVerifyResponseDto {
  return data;
}
