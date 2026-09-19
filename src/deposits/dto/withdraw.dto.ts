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

export class CreateWithdrawDto {
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

export class WithdrawItemDto {
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

export class ListWithdrawsQueryDto {
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

  @ApiPropertyOptional({
    enum: ['pending', 'success', 'failed', 'rejected'],
  })
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

export function toWithdrawItem(w: {
  id: string;
  userId: string;
  amount: number;
  status: string;
  trackId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WithdrawItemDto {
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
