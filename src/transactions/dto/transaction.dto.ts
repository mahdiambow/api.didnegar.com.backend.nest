import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { IsULID } from '../../common/id/index.js';
import {
  transactionSourceTypes,
  transactionStates,
  type TransactionSourceType,
  type TransactionState,
} from '../entities/transaction.types.js';

export class TransactionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['credit', 'debit'] })
  type: string;

  @ApiProperty({ enum: transactionSourceTypes })
  sourceType: string;

  @ApiPropertyOptional({ nullable: true })
  sourceId: string | null;

  @ApiProperty({ enum: transactionStates })
  state: string;

  @ApiProperty()
  userType: string;

  @ApiPropertyOptional({ nullable: true })
  orderId: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ListTransactionsQueryDto {
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

  @ApiPropertyOptional({ enum: transactionStates })
  @IsOptional()
  @IsIn([...transactionStates])
  state?: TransactionState;

  @ApiPropertyOptional({ enum: transactionSourceTypes })
  @IsOptional()
  @IsIn([...transactionSourceTypes])
  sourceType?: TransactionSourceType;

  @ApiPropertyOptional({ description: 'فقط ادمین — فیلتر بر اساس کاربر' })
  @IsOptional()
  @IsULID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  orderId?: string;
}

export function toTransactionItem(t: {
  id: string;
  userId: string;
  amount: number;
  type: string;
  sourceType: string;
  sourceId: string | null;
  state: string;
  userType: string;
  orderId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TransactionItemDto {
  return {
    id: t.id,
    userId: t.userId,
    amount: Number(t.amount),
    type: t.type,
    sourceType: t.sourceType,
    sourceId: t.sourceId,
    state: t.state,
    userType: t.userType,
    orderId: t.orderId,
    description: t.description,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
