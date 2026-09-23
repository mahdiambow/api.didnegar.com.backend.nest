import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAddress } from '../users/entities/user-address.entity.js';
import { AuthModule } from '../utils/auth/auth.module.js';
import { AddressesController } from './addresses.controller.js';
import { AddressesService } from './addresses.service.js';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([UserAddress]),
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
