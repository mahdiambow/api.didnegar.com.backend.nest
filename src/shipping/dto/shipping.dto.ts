import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingMethod } from '../entities/shipping-method.entity.js';

export class ShippingQuoteQueryDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
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
  const subtotal = unitPrice * quantity;
  const shippingAmount = shippingPrice;
  const displayTotal = subtotal + shippingAmount;
  const payableAmount = isCod ? subtotal : displayTotal;

  return {
    subtotal,
    shippingAmount,
    displayTotal,
    payableAmount,
  };
}
