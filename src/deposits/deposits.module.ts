import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity.js';
import { Withdraw } from './entities/withdraw.entity.js';
import { DepositsService } from './deposits.service.js';
import { DepositsController } from './deposits.controller.js';
import { WithdrawsController } from './withdraws.controller.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { ZibalService } from './services/zibal.service.js';
import { ZibalMockService } from './services/zibal-mock.service.js';
import { LoanMockService } from './services/loan-mock.service.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import { WithdrawRepository } from './repositories/withdraw.repository.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { CreditModule } from '../credit/credit.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { ConfigService } from '../config/config.service.js';
import type { IBank } from './services/deposit-gateway.interface.js';
import { ZIBAL_PROVIDER } from './zibal.constants.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit, Withdraw]),
    OrdersModule,
    CreditModule,
    TransactionsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [DepositsController, WithdrawsController],
  providers: [
    DepositsService,
    ZarinpalMockService,
    ZibalService,
    ZibalMockService,
    LoanMockService,
    DepositRepository,
    WithdrawRepository,
    {
      provide: ZIBAL_PROVIDER,
      inject: [ConfigService, ZibalService, ZibalMockService],
      useFactory: (
        config: ConfigService,
        real: ZibalService,
        mock: ZibalMockService,
      ): IBank =>
        config.getBooleanOptional('ZIBAL_USE_MOCK', false) ? mock : real,
    },
  ],
  exports: [DepositsService, DepositRepository, WithdrawRepository],
})
export class DepositsModule {}
