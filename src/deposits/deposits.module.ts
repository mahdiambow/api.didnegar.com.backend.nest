import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity.js';
import { DepositsService } from './deposits.service.js';
import { DepositsController } from './deposits.controller.js';
import { PaymentGatewaysModule } from '../utils/payment-gateways/payment-gateways.module.js';
import { ZibalGatewayService } from '../utils/payment-gateways/zibal/zibal-gateway.service.js';
import { ZibalMockService } from '../utils/payment-gateways/zibal/zibal-mock.service.js';
import { LoanMockService } from '../utils/payment-gateways/loan/loan-mock.service.js';
import { DepositRepository } from './repositories/deposit.repository.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { CreditModule } from '../credit/credit.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { ConfigService } from '../config/config.service.js';
import type { PaymentGateway } from '../utils/payment-gateways/payment-gateway.interface.js';
import { ZIBAL_PROVIDER } from './zibal.constants.js';
import { DepositVerificationQueue } from './queues/deposit-verification.queue.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit]),
    forwardRef(() => OrdersModule),
    CreditModule,
    TransactionsModule,
    PaymentGatewaysModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [DepositsController],
  providers: [
    DepositsService,
    DepositVerificationQueue,
    DepositRepository,
    {
      provide: ZIBAL_PROVIDER,
      inject: [ConfigService, ZibalGatewayService, ZibalMockService],
      useFactory: (
        config: ConfigService,
        real: ZibalGatewayService,
        mock: ZibalMockService,
      ): PaymentGateway =>
        config.get('NODE_ENV') === 'stage' ||
        config.getBooleanOptional('ZIBAL_USE_MOCK', false)
          ? mock
          : real,
    },
  ],
  exports: [DepositsService, DepositRepository],
})
export class DepositsModule {}
