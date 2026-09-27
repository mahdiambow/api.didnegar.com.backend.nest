import { Module } from '@nestjs/common';
import { ZibalGatewayService } from './zibal/zibal-gateway.service.js';
import { ZibalMockService } from './zibal/zibal-mock.service.js';
import { LoanMockService } from './loan/loan-mock.service.js';

@Module({
  providers: [ZibalGatewayService, ZibalMockService, LoanMockService],
  exports: [ZibalGatewayService, ZibalMockService, LoanMockService],
})
export class PaymentGatewaysModule {}
