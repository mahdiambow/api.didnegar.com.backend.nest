import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddShoppingCartItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  offerId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateShoppingCartItemDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ShoppingCartOfferDto {
  @ApiProperty() offerId: string;
  @ApiProperty() sellerId: string;
  @ApiProperty() productId: string;
  @ApiProperty() sku: string;
  @ApiProperty() price: number;
  @ApiProperty() stock: number;
}

export class ShoppingCartItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() offerId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() subtotal: number;
  @ApiProperty({ type: ShoppingCartOfferDto }) offer: ShoppingCartOfferDto;
}

export class ShoppingCartResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty({ type: [ShoppingCartItemResponseDto] })
  items: ShoppingCartItemResponseDto[];
  @ApiProperty() subtotal: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
