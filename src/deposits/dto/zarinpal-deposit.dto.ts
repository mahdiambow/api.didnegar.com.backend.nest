import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateDepositDto } from './deposit.dto.js';

export class CreateZarinpalPaymentDto extends CreateDepositDto {}

export class VerifyZarinpalPaymentQueryDto {
  /** Zarinpal callback query param (maps to deposit.trackId) */
  @ApiProperty({ example: 'A000000000000000000000000000000000' })
  @IsString()
  Authority: string;

  @ApiProperty({ example: 'OK' })
  @IsString()
  Status: string;
}
