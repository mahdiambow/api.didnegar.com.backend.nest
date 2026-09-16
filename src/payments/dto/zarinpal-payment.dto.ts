import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentVerifyResponseDto,
  toPaymentResponse,
  toPaymentVerifyResponse,
} from './payment.dto.js';

export class CreateZarinpalPaymentDto extends CreatePaymentDto {}

export class VerifyZarinpalPaymentQueryDto {
  @ApiProperty({ example: 'A000000000000000000000000000000000' })
  @IsString()
  Authority: string;

  @ApiProperty({ example: 'OK' })
  @IsString()
  Status: string;
}

export {
  PaymentResponseDto as ZarinpalPaymentResponseDto,
  PaymentVerifyResponseDto as ZarinpalVerifyResponseDto,
  toPaymentResponse as toZarinpalPaymentResponse,
  toPaymentVerifyResponse as toZarinpalVerifyResponse,
};
