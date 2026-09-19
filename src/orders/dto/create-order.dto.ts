import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { DepositMethod } from '../../deposits/deposit-method.enum.js';

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
  @ApiProperty({ type: [OrderProductDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: OrderProductDto) => item?.offerId)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];

  @ApiProperty({ example: '01JEX000000000000000000030' })
  @IsULID()
  shippingMethodId: string;

  @ApiProperty({
    enum: DepositMethod,
    description:
      'روش پرداخت: credit | zarinpal | zibal | loan — بلافاصله بعد از ساخت سفارش اجرا می‌شود',
  })
  @IsEnum(DepositMethod)
  paymentMethod: DepositMethod;
}
