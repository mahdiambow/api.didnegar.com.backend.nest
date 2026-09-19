import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../utils/auth/auth.module.js';
import { CreditModule } from '../credit/credit.module.js';
import { DepositsModule } from '../deposits/deposits.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';

@Module({
  imports: [
    CreditModule,
    DepositsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
