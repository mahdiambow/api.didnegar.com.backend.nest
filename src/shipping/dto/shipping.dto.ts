import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import BigNumber from 'bignumber.js';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingMethod } from '../entities/shipping-method.entity.js';

export class ShippingQuoteQueryDto {
  @ApiProperty()
  @IsULID()
  offerId: string;

  @ApiProperty()
  @IsULID()
  shippingMethodId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class ShippingMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 85000 })
  price: number;

  @ApiProperty({
    description: 'پس کرایه — هزینه ارسال در محل دریافت می‌شود',
  })
  isCod: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ShippingQuoteResponseDto {
  @ApiProperty()
  offerId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: ShippingMethodResponseDto })
  shippingMethod: ShippingMethodResponseDto;

  @ApiProperty({ example: 65000000, description: 'جمع قیمت محصول' })
  subtotal: number;

  @ApiProperty({ example: 85000, description: 'هزینه ارسال' })
  shippingAmount: number;

  @ApiProperty({
    example: 65085000,
    description: 'مجموع کل (محصول + ارسال)',
  })
  displayTotal: number;

  @ApiProperty({
    example: 65000000,
    description: 'مبلغ قابل پرداخت آنلاین (برای پس‌کرایه فقط محصول)',
  })
  payableAmount: number;
}

export function toShippingMethodResponse(
  method: ShippingMethod,
): ShippingMethodResponseDto {
  return {
    id: method.id,
    slug: method.slug,
    name: method.name,
    price: Number(method.price),
    isCod: method.isCod,
    sortOrder: method.sortOrder,
    isActive: method.isActive,
    createdAt: method.createdAt,
    updatedAt: method.updatedAt,
  };
}

export interface OrderAmountBreakdown {
  subtotal: number;
  shippingAmount: number;
  displayTotal: number;
  payableAmount: number;
}

export function calculateOrderAmounts(
  unitPrice: number,
  quantity: number,
  shippingPrice: number,
  isCod: boolean,
): OrderAmountBreakdown {
  const subtotal = new BigNumber(unitPrice).times(quantity);
  const shippingAmount = new BigNumber(shippingPrice);
  const displayTotal = subtotal.plus(shippingAmount);
  const payableAmount = isCod ? subtotal : displayTotal;

  return {
    subtotal: subtotal.toNumber(),
    shippingAmount: shippingAmount.toNumber(),
    displayTotal: displayTotal.toNumber(),
    payableAmount: payableAmount.toNumber(),
  };
}
