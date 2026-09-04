import { ApiProperty } from '@nestjs/swagger';
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
  Authority: string;

  @ApiProperty({ example: 'OK' })
  Status: string;
}

export {
  PaymentResponseDto as ZarinpalPaymentResponseDto,
  PaymentVerifyResponseDto as ZarinpalVerifyResponseDto,
  toPaymentResponse as toZarinpalPaymentResponse,
  toPaymentVerifyResponse as toZarinpalVerifyResponse,
};
