import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { CreditLog } from './entities/credit-log.entity.js';
import { UserCredit } from './entities/user-credit.entity.js';
import { CreditService } from './credit.service.js';
import { CreditController } from './credit.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCredit, CreditLog]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
