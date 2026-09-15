import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { Admin } from './entities/admin.entity.js';
import { AdminRepository } from './repositories/admin.repository.js';
import { AdminsService } from './admins.service.js';
import { AdminsController } from './admins.controller.js';
import { AdminAuthController } from './admin-auth.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Admin]), AuthModule, RolesModule],
  controllers: [AdminAuthController, AdminsController],
  providers: [AdminRepository, AdminsService],
  exports: [AdminRepository, TypeOrmModule],
})
export class AdminModule {}
