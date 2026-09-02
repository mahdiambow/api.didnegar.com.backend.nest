import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { SellersModule } from '../sellers/sellers.module.js';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    RolesModule,
    SellersModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
