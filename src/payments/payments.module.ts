import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { ZibalMockService } from './services/zibal-mock.service.js';
import { LoanMockService } from './services/loan-mock.service.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { CreditModule } from '../credit/credit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit]),
    OrdersModule,
    CreditModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    ZarinpalMockService,
    ZibalMockService,
    LoanMockService,
    DepositRepository,
  ],
  exports: [PaymentsService, DepositRepository],
})
export class PaymentsModule {}
