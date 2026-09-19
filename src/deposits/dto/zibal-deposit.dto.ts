import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class VerifyZibalPaymentQueryDto {
  @ApiProperty({ example: 123456789 })
  @Type(() => Number)
  @IsInt()
  trackId: number;

  @ApiProperty({ example: 1, description: '1=موفق، 0=ناموفق' })
  @Type(() => Number)
  @IsInt()
  success: number;

  @ApiProperty({ required: false })
  @IsOptional()
  orderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  status?: number;
}
