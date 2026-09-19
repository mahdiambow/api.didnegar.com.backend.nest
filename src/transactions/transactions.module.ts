import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionService } from './transaction.service.js';
import { TransactionsController } from './transactions.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionService],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionsModule {}
