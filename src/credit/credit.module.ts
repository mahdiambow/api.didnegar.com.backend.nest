import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { CreditLedger } from './entities/credit-ledger.entity.js';
import { UserCredit } from './entities/user-credit.entity.js';
import { CreditService } from './credit.service.js';
import { CreditController } from './credit.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCredit, CreditLedger]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
