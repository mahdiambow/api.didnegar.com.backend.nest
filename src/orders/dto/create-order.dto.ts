import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export const ORDER_PAYMENT_METHODS = [
  'credit',
  'iBank',
  'loan',
  'partial-bank',
] as const;

export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];

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

export class OrderPriceDto {
  @ApiPropertyOptional({
    example: 68000000,
    description: 'مبلغ کالا قبل از تخفیف (subtotal)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 2000000, description: 'مبلغ تخفیف' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    example: 66000000,
    description: 'مبلغ نهایی قابل پرداخت',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({
    example: 50000000,
    description: 'قیمت خرید',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  purchasePrice?: number | null;

  @ApiPropertyOptional({
    example: 65000000,
    description: 'قیمت فروش',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  salePrice?: number | null;
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
    enum: ORDER_PAYMENT_METHODS,
    default: 'iBank',
    description:
      'روش پرداخت — partial-bank: موجودی ناقص کیف پول + مابقی بانک',
  })
  @IsOptional()
  @IsIn([...ORDER_PAYMENT_METHODS])
  paymentMethod?: OrderPaymentMethod;

  @ApiPropertyOptional({
    type: OrderPriceDto,
    description: 'اختیاری — تخفیف / override مبلغ',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderPriceDto)
  price?: OrderPriceDto;
}
