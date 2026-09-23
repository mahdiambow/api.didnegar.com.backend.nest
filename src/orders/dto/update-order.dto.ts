import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsArray, ArrayMinSize, ArrayUnique, ValidateNested, ValidateIf, IsNumber, IsOptional, Min } from 'class-validator';

import { Type } from 'class-transformer';
import { OrderProductDto } from './create-order.dto.js';
import { ORDER_STATUSES } from '../entities/order.entity.js';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    enum: ORDER_STATUSES,
    description:
      'pending | processing (در حال پردازش) | left_warehouse (خروج از انبار) | shipped (ارسال شده) | failed | cancelled',
  })
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({ type: [OrderProductDto], minItems: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: OrderProductDto) => item?.offerId)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products?: OrderProductDto[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsULID()
  shippingMethodId?: string | null;

  @ApiPropertyOptional({ example: 65000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional({ example: 85000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingAmount?: number;

  @ApiPropertyOptional({ example: 65000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
