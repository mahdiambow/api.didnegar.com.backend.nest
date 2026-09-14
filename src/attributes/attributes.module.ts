import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity.js';
import { AttributeValue } from './entities/attribute-value.entity.js';
import { AttributesService } from './attributes.service.js';
import { AttributesSeedService } from './attributes.seed.service.js';
import { AttributeRepository } from './repositories/attribute.repository.js';
import { AttributeValueRepository } from './repositories/attribute-value.repository.js';
import { AttributesController } from './attributes.controller.js';
import { AttributeValuesController } from './attribute-values.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attribute, AttributeValue]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [AttributesController, AttributeValuesController],
  providers: [
    AttributesService,
    AttributesSeedService,
    AttributeRepository,
    AttributeValueRepository,
  ],
  exports: [
    AttributesService,
    AttributesSeedService,
    AttributeRepository,
    AttributeValueRepository,
  ],
})
export class AttributesModule {}
