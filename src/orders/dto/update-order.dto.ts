import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  ValidateNested,
  ValidateIf,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { OrderProductDto } from './create-order.dto.js';

const ORDER_STATUSES = ['pending', 'paid', 'failed', 'cancelled'] as const;

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({ type: [OrderProductDto], minItems: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: OrderProductDto) => item?.productId)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products?: OrderProductDto[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
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
