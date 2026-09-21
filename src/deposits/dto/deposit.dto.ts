import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

export class DepositResponseDto {
  @ApiPropertyOptional({ nullable: true })
  orderId?: string | null;

  @ApiPropertyOptional({
    description: 'شناسه واریز — برای پرداخت credit خالی است',
  })
  depositId?: string;

  @ApiPropertyOptional({ description: 'شناسه transaction ثبت‌شده برای این عملیات' })
  transactionId?: string;

  @ApiProperty({ enum: ['iBank', 'loan', 'credit', 'partial-bank'] })
  gateway: string;

  @ApiProperty({ description: 'trackId (درگاه / وام / credit token)' })
  trackId: string;

  @ApiProperty({
    description: 'برای credit خالی است؛ برای درگاه/وام URL هدایت',
  })
  paymentUrl: string;

  @ApiProperty({ description: 'مبلغ کل سفارش / عملیات' })
  amount: number;

  @ApiPropertyOptional({
    description: 'سهم کیف پول در پرداخت ترکیبی (partial-bank)',
  })
  creditApplied?: number;

  @ApiPropertyOptional({
    description: 'مبلغی که از درگاه بانکی گرفته می‌شود',
  })
  bankAmount?: number;

  @ApiPropertyOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  shippingAmount?: number;

  @ApiPropertyOptional()
  displayTotal?: number;

  @ApiPropertyOptional({ type: ShippingMethodResponseDto, nullable: true })
  shippingMethod?: ShippingMethodResponseDto | null;

  @ApiProperty()
  gatewayMessage: string;

  @ApiPropertyOptional({ description: 'موجودی کیف پول بعد از عملیات' })
  creditBalance?: number;
}

export function toDepositResponse(data: DepositResponseDto): DepositResponseDto {
  return data;
}
