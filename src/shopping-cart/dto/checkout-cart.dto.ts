import { IsULID } from '../../common/id/index.js';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray } from 'class-validator';

export class CheckoutCartDto {
  @ApiProperty({ example: '01JEX000000000000000000040' })
  @IsULID()
  addressId: string;

  @ApiProperty({
    type: [String],
    minItems: 1,
    example: ['01JEX000000000000000000030'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsULID({ each: true })
  shippingMethodIds: string[];
}
