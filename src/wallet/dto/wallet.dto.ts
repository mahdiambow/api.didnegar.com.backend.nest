import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { IsULID } from '../../common/id/index.js';

export class WalletBalanceDto {
  @ApiProperty({ example: 1500000 })
  amount: number;

  @ApiProperty({ example: 0 })
  lockedAmount: number;
}

export class WalletItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  username: string | null;

  @ApiPropertyOptional({ nullable: true })
  displayName: string | null;

  @ApiProperty({ example: 1500000 })
  amount: number;

  @ApiProperty({ example: 0 })
  lockedAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toWalletItem(w: {
  id: string;
  userId: string;
  amount: number;
  lockedAmount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: { username?: string | null; displayName?: string | null } | null;
}): WalletItemDto {
  return {
    id: w.id,
    userId: w.userId,
    username: w.user?.username ?? null,
    displayName: w.user?.displayName ?? null,
    amount: Number(w.amount),
    lockedAmount: Number(w.lockedAmount),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

export class CreateWalletDepositDto {
  @ApiProperty({ example: 500000, description: 'مبلغ واریز (ریال، عدد صحیح)' })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  amount: number;

  @ApiProperty({
    enum: ['zarinpal', 'zibal'],
    description: 'درگاه بانکی برای شارژ کیف پول',
  })
  @IsIn(['zarinpal', 'zibal'])
  method: 'zarinpal' | 'zibal';
}

export class CreateWalletWithdrawDto {
  @ApiProperty({ example: 200000, description: 'مبلغ برداشت (ریال)' })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  amount: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class WalletDepositItemDto {
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

export class WalletWithdrawItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ nullable: true })
  trackId: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListWalletQueryDto {
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

  @ApiPropertyOptional({ enum: ['pending', 'success', 'failed', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'فقط ادمین — فیلتر بر اساس کاربر' })
  @IsOptional()
  @IsULID()
  userId?: string;
}

export class ReviewWithdrawDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';
}

export function toWalletDepositItem(d: {
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
}): WalletDepositItemDto {
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

export function toWalletWithdrawItem(w: {
  id: string;
  userId: string;
  amount: number;
  status: string;
  trackId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WalletWithdrawItemDto {
  return {
    id: w.id,
    userId: w.userId,
    amount: Number(w.amount),
    status: w.status,
    trackId: w.trackId,
    description: w.description,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}
