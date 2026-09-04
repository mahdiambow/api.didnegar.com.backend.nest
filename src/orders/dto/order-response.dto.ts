import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../../payments/entities/order.entity.js';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';
import { toShippingMethodResponse } from '../../shipping/dto/shipping.dto.js';

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  shippingMethodId: string | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingAmount: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  displayTotal: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  productName?: string;

  @ApiPropertyOptional({ type: ShippingMethodResponseDto, nullable: true })
  shippingMethod?: ShippingMethodResponseDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toOrderResponse(order: Order): OrderResponseDto {
  const subtotal = Number(order.subtotal);
  const shippingAmount = Number(order.shippingAmount);

  return {
    id: order.id,
    userId: order.userId,
    productId: order.productId,
    shippingMethodId: order.shippingMethodId,
    quantity: order.quantity,
    subtotal,
    shippingAmount,
    amount: Number(order.amount),
    displayTotal: subtotal + shippingAmount,
    status: order.status,
    productName: order.product?.name,
    shippingMethod: order.shippingMethod
      ? toShippingMethodResponse(order.shippingMethod)
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
