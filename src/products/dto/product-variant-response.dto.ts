import { ApiProperty } from '@nestjs/swagger';
import { ProductVariant } from '../entities/product-variant.entity.js';

export class ProductAttributeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;
}

export class ProductVariantResponseDto extends ProductAttributeResponseDto {}

export function toProductAttributeResponse(
  variant: ProductVariant,
): ProductAttributeResponseDto {
  return {
    id: variant.id,
    productId: variant.productId,
  };
}

export const toProductVariantResponse = toProductAttributeResponse;
