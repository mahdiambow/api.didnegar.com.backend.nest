import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';
import { DepositMethod, BankPaymentMethod } from '../deposit-method.enum.js';

/** فقط شارژ اعتبار — بدون سفارش؛ فقط درگاه بانکی */
export class CreateTopUpDto {
  @ApiProperty({ example: 500000, description: 'مبلغ واریز (ریال)' })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  amount: number;

  @ApiProperty({
    enum: BankPaymentMethod,
    example: BankPaymentMethod.ZIBAL,
    description: 'روش پرداخت بانکی (zarinpal | zibal) — loan/credit مجاز نیست',
  })
  @IsEnum(BankPaymentMethod)
  paymentMethod: BankPaymentMethod;
}

/** کال‌بک یکپارچه درگاه‌ها — GET /deposits/verify/:method */
export class VerifyDepositQueryDto {
  @ApiPropertyOptional({ description: 'زرین‌پال — Authority' })
  @IsOptional()
  @IsString()
  Authority?: string;

  @ApiPropertyOptional({ description: 'زرین‌پال — Status (OK/NOK)' })
  @IsOptional()
  @IsString()
  Status?: string;

  @ApiPropertyOptional({ description: 'زیبال / وام — trackId' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  trackId?: number;

  @ApiPropertyOptional({ description: 'زیبال / وام — success (1/0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  success?: number;

  @ApiPropertyOptional({ description: 'زیبال — status درگاه (2=موفق)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class DepositItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  orderId: string | null;

  @ApiProperty({ enum: DepositMethod })
  gateway: string;

  @ApiProperty()
  trackId: string;

  @ApiPropertyOptional({ nullable: true })
  refId: string | null;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListDepositsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: ['pending', 'success', 'failed'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'فقط ادمین — فیلتر بر اساس کاربر' })
  @IsOptional()
  @IsULID()
  userId?: string;
}

export function toDepositItem(d: {
  id: string;
  userId: string;
  orderId: string | null;
  gateway: string;
  trackId: string;
  refId: string | null;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): DepositItemDto {
  return {
    id: d.id,
    userId: d.userId,
    orderId: d.orderId,
    gateway: d.gateway,
    trackId: d.trackId,
    refId: d.refId,
    amount: Number(d.amount),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export class DepositResponseDto {
  @ApiPropertyOptional({ nullable: true })
  orderId?: string | null;

  @ApiPropertyOptional()
  depositId?: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiProperty({ enum: DepositMethod })
  gateway: DepositMethod | string;

  @ApiProperty()
  trackId: string;

  @ApiProperty()
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

  @ApiPropertyOptional()
  creditBalance?: number;
}

export class DepositVerifyResponseDto {
  @ApiPropertyOptional({ nullable: true })
  orderId?: string | null;

  @ApiProperty()
  depositId: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiProperty({ enum: DepositMethod })
  gateway: DepositMethod | string;

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
