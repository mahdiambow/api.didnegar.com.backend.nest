import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { Seller } from './entities/seller.entity.js';
import { SellerContract } from './entities/seller-contract.entity.js';
import { SellerRepository } from './repositories/seller.repository.js';
import { SellerContractRepository } from './repositories/seller-contract.repository.js';
import { SellersService } from './sellers.service.js';
import { SellerContractsService } from './seller-contracts.service.js';
import { SellersController } from './sellers.controller.js';
import { SellerContractsController } from './seller-contracts.controller.js';
import { SellerAuthController } from './seller-auth.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seller, SellerContract]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [SellersController, SellerContractsController, SellerAuthController],
  providers: [
    SellersService,
    SellerContractsService,
    SellerRepository,
    SellerContractRepository,
  ],
  exports: [SellerRepository, SellerContractRepository, TypeOrmModule],
})
export class SellersModule {}
