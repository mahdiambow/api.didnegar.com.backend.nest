import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { UserAuthController } from './user-auth.controller.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { SellersModule } from '../sellers/sellers.module.js';
import { CreditModule } from '../credit/credit.module.js';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    RolesModule,
    SellersModule,
    CreditModule,
  ],
  controllers: [UsersController, UserAuthController],
  providers: [UsersService],
})
export class UsersModule {}
