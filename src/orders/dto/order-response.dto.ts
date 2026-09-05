import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../../payments/entities/order.entity.js';
import { ShippingMethodResponseDto } from '../../shipping/dto/shipping.dto.js';
import { toShippingMethodResponse } from '../../shipping/dto/shipping.dto.js';

export class OrderProductResponseDto {
  @ApiProperty()
  productId: string;

  @ApiPropertyOptional()
  productName?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  subtotal: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [OrderProductResponseDto] })
  products: OrderProductResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  shippingMethodId: string | null;

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
    products: order.items.map((item) => ({
      productId: item.productId,
      productName: item.product?.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.unitPrice) * item.quantity,
    })),
    shippingMethodId: order.shippingMethodId,
    subtotal,
    shippingAmount,
    amount: Number(order.amount),
    displayTotal: subtotal + shippingAmount,
    status: order.status,
    shippingMethod: order.shippingMethod
      ? toShippingMethodResponse(order.shippingMethod)
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
