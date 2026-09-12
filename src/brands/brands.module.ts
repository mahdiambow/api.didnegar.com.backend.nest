import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { Brand } from './entities/brand.entity.js';
import { BrandRepository } from './repositories/brand.repository.js';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [BrandsController],
  providers: [BrandsService, BrandRepository],
  exports: [BrandsService, BrandRepository, TypeOrmModule],
})
export class BrandsModule {}
