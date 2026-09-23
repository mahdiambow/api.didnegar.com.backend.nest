import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { ORDER_STATUSES } from '../entities/order.entity.js';

const ORDER_TYPES = ['user', 'customer'] as const;

export class ListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ORDER_STATUSES,
    description:
      'pending | processing (در حال پردازش) | left_warehouse (خروج از انبار) | shipped (ارسال شده) | failed | cancelled',
  })
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({
    enum: ORDER_TYPES,
    description: 'user = خرید آنلاین | customer = سفارش تلفنی',
  })
  @IsOptional()
  @IsIn(ORDER_TYPES)
  type?: (typeof ORDER_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  customerId?: string;
}
