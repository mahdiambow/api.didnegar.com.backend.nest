import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

/** شارژ کیف پول / درخواست درگاه — orderId اختیاری (مثلاً فقط شارژ wallet) */
export class CreateDepositDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'اختیاری — برای شارژ کیف پول بدون سفارش خالی بگذارید',
  })
  @IsOptional()
  @IsULID()
  orderId?: string;
}

export class RequestDepositDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'اختیاری — پرداخت سفارش یا فقط شارژ',
  })
  @IsOptional()
  @IsULID()
  orderId?: string;

  @ApiProperty({
    enum: ['credit', 'zarinpal', 'zibal', 'loan'],
    description:
      'credit = کیف پول | zarinpal/zibal = درگاه بانکی (IBank) | loan = وام شخص ثالث (ILoan)',
  })
  @IsIn(['credit', 'zarinpal', 'zibal', 'loan'])
  method: 'credit' | 'zarinpal' | 'zibal' | 'loan';
}

export class DepositResponseDto {
  @ApiPropertyOptional({ nullable: true })
  orderId?: string | null;

  @ApiPropertyOptional({
    description: 'شناسه واریز — برای پرداخت credit خالی است',
  })
  depositId?: string;

  @ApiPropertyOptional({ description: 'شناسه transaction ثبت‌شده برای این عملیات' })
  transactionId?: string;

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

export class DepositVerifyResponseDto {
  @ApiPropertyOptional({ nullable: true })
  orderId?: string | null;

  @ApiProperty()
  depositId: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiProperty({ enum: ['zarinpal', 'zibal', 'loan', 'credit'] })
  gateway: string;

  @ApiProperty()
  refId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  shippingAmount?: number;

  @ApiPropertyOptional()
  displayTotal?: number;

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
