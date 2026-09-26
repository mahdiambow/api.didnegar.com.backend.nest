import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { ORDER_STATUSES } from '../entities/order.entity.js';

/** فیلتر لیست سفارش‌های خود کاربر */
export class ListMyOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ORDER_STATUSES,
    description:
      'pending | processing (در حال پردازش) | left_warehouse (خروج از انبار) | shipped (ارسال شده) | failed | cancelled',
  })
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: (typeof ORDER_STATUSES)[number];
}
