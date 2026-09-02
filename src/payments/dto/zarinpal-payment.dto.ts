import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

export class CreateZarinpalPaymentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  orderId: string;
}

export class VerifyZarinpalPaymentQueryDto {
  @ApiProperty({ example: 'A000000000000000000000000000000000' })
  Authority: string;

  @ApiProperty({ example: 'OK' })
  Status: string;
}

export class ZarinpalPaymentResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  authority: string;

  @ApiProperty({ example: 'https://sandbox.zarinpal.com/pg/StartPay/...' })
  paymentUrl: string;

  @ApiProperty({ example: 65000000 })
  amount: number;

  @ApiProperty({ example: 65000000 })
  subtotal: number;

  @ApiProperty({ example: 85000 })
  shippingAmount: number;

  @ApiProperty({ example: 65085000 })
  displayTotal: number;

  @ApiPropertyOptional({ type: ShippingMethodResponseDto, nullable: true })
  shippingMethod?: ShippingMethodResponseDto | null;

  @ApiProperty({ example: '[MOCK] درخواست پرداخت ثبت شد' })
  gatewayMessage: string;
}

export class ZarinpalVerifyResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

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

  @ApiProperty({ example: '[MOCK] پرداخت تأیید شد' })
  gatewayMessage: string;
}

export function toZarinpalPaymentResponse(data: {
  orderId: string;
  paymentId: string;
  authority: string;
  paymentUrl: string;
  amount: number;
  subtotal: number;
  shippingAmount: number;
  displayTotal: number;
  shippingMethod?: ShippingMethodResponseDto | null;
  gatewayMessage: string;
}): ZarinpalPaymentResponseDto {
  return data;
}

export function toZarinpalVerifyResponse(data: {
  orderId: string;
  paymentId: string;
  refId: string;
  status: string;
  amount: number;
  subtotal: number;
  shippingAmount: number;
  displayTotal: number;
  shippingMethod?: ShippingMethodResponseDto | null;
  productName?: string;
  gatewayMessage: string;
}): ZarinpalVerifyResponseDto {
  return data;
}
