import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity.js';
import { Withdraw } from './entities/withdraw.entity.js';
import { Transaction } from './entities/transaction.entity.js';
import { DepositsService } from './deposits.service.js';
import { DepositsController } from './deposits.controller.js';
import { TransactionService } from './transaction.service.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { ZibalMockService } from './services/zibal-mock.service.js';
import { LoanMockService } from './services/loan-mock.service.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { CreditModule } from '../credit/credit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit, Withdraw, Transaction]),
    OrdersModule,
    CreditModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [DepositsController],
  providers: [
    DepositsService,
    TransactionService,
    ZarinpalMockService,
    ZibalMockService,
    LoanMockService,
    DepositRepository,
  ],
  exports: [DepositsService, DepositRepository, TransactionService],
})
export class DepositsModule {}
