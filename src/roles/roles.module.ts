import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity.js';
import { RolesService } from './roles.service.js';
import { RolesController } from './roles.controller.js';
import { RolesSeedService } from './roles.seed.service.js';
import { RoleRepository } from './repositories/role.repository.js';
import { AuthModule } from '../auth/auth.module.js';
import { SellersModule } from '../sellers/sellers.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => AuthModule),
    forwardRef(() => SellersModule),
  ],
  controllers: [RolesController],
  providers: [RolesService, RolesSeedService, RoleRepository],
  exports: [RolesService, RolesSeedService, RoleRepository],
})
export class RolesModule {}
