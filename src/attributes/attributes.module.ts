import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity.js';
import { AttributesService } from './attributes.service.js';
import { AttributesSeedService } from './attributes.seed.service.js';
import { AttributeRepository } from './repositories/attribute.repository.js';
import { AttributesController } from './attributes.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attribute]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [AttributesController],
  providers: [AttributesService, AttributesSeedService, AttributeRepository],
  exports: [AttributesService, AttributesSeedService, AttributeRepository],
})
export class AttributesModule {}
