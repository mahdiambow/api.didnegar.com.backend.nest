import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';

/** شارژ اعتبار از درگاه — بدون سفارش */
export class CreateTopUpDto {
  @ApiProperty({ example: 500000, description: 'مبلغ واریز (ریال، عدد صحیح)' })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  amount: number;

  @ApiProperty({
    enum: ['zarinpal', 'zibal'],
    description: 'درگاه بانکی برای شارژ اعتبار',
  })
  @IsIn(['zarinpal', 'zibal'])
  method: 'zarinpal' | 'zibal';
}

/** شارژ اعتبار / درخواست درگاه — orderId اختیاری */
export class CreateDepositDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'اختیاری — برای شارژ اعتبار بدون سفارش خالی بگذارید',
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
      'credit = اعتبار | zarinpal/zibal = درگاه بانکی (IBank) | loan = وام شخص ثالث (ILoan)',
  })
  @IsIn(['credit', 'zarinpal', 'zibal', 'loan'])
  method: 'credit' | 'zarinpal' | 'zibal' | 'loan';
}

export class DepositItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  orderId: string | null;

  @ApiProperty()
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

  @ApiPropertyOptional({
    description: 'شناسه واریز — برای پرداخت credit خالی است',
  })
  depositId?: string;

  @ApiPropertyOptional({
    description: 'شناسه transaction ثبت‌شده برای این عملیات',
  })
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

  @ApiPropertyOptional({ description: 'موجودی اعتبار بعد از عملیات' })
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
