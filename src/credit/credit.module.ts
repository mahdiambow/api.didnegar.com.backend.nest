import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditLog } from './entities/credit-log.entity.js';
import { UserCredit } from './entities/user-credit.entity.js';
import { CreditService } from './credit.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserCredit, CreditLog])],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
