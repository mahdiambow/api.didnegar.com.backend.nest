import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Query params از callback زیبال (متد API: iBank):
 * https://help.zibal.ir/ipg/ — success, trackId, status, orderId
 * success=1 و status=2 → کاربر پرداخت را انجام داده؛ سپس باید v1/verify زده شود.
 */
export class VerifyIBankPaymentQueryDto {
  @ApiProperty({ example: 123456789, description: 'trackId برگشتی از زیبال' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trackId: number;

  @ApiProperty({ example: 1, description: '1=موفق، 0=ناموفق' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  success: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'وضعیت پرداخت درگاه؛ 2 = پرداخت موفق (قبل از verify)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ description: 'orderId ارسالی در request (اختیاری)' })
  @IsOptional()
  orderId?: string;
}
