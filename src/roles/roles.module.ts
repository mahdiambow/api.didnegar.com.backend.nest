import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity.js';
import { RolesService } from './roles.service.js';
import { RolesController } from './roles.controller.js';
import { RolesSeedService } from './roles.seed.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => AuthModule),
  ],
  controllers: [RolesController],
  providers: [RolesService, RolesSeedService],
  exports: [RolesService, RolesSeedService, TypeOrmModule],
})
export class RolesModule {}
