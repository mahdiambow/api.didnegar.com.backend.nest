import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { CreditModule } from '../credit/credit.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { Withdraw } from './entities/withdraw.entity.js';
import { WithdrawRepository } from './repositories/withdraw.repository.js';
import { WithdrawsService } from './withdraws.service.js';
import { WithdrawsController } from './withdraws.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdraw]),
    CreditModule,
    TransactionsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [WithdrawsController],
  providers: [WithdrawsService, WithdrawRepository],
  exports: [WithdrawsService, WithdrawRepository],
})
export class WithdrawsModule {}
