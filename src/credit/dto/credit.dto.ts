import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { IsULID } from '../../common/id/index.js';

export class CreditBalanceDto {
  @ApiProperty({ example: 1500000 })
  amount: number;

  @ApiProperty({ example: 0 })
  lockedAmount: number;
}

export class CreditItemDto {
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

export class ListCreditsQueryDto {
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

  @ApiPropertyOptional({ description: 'فیلتر بر اساس کاربر' })
  @IsOptional()
  @IsULID()
  userId?: string;
}

export function toCreditItem(w: {
  id: string;
  userId: string;
  amount: number;
  lockedAmount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: { username?: string | null; displayName?: string | null } | null;
}): CreditItemDto {
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
