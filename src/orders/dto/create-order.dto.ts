import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderProductDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  offerId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    type: [OrderProductDto],
    minItems: 1,
    description:
      'اگر خالی باشد، آیتم‌های سبد خرید کاربر برای سفارش استفاده می‌شوند',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: OrderProductDto) => item?.offerId)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products?: OrderProductDto[];

  @ApiProperty({
    example: '01JEX000000000000000000010',
    description: 'شناسه آدرس کاربر (از CRUD آدرس‌ها)',
  })
  @IsULID()
  addressId: string;

  @ApiProperty({ example: '01JEX000000000000000000030' })
  @IsULID()
  shippingMethodId: string;

  @ApiPropertyOptional({
    enum: ['credit', 'iBank', 'loan', 'partial-bank'],
    default: 'iBank',
    description:
      'روش پرداخت — partial-bank: موجودی ناقص کیف پول + مابقی بانک',
  })
  @IsOptional()
  @IsIn(['credit', 'iBank', 'loan', 'partial-bank'])
  paymentMethod?: 'credit' | 'iBank' | 'loan' | 'partial-bank';
}
