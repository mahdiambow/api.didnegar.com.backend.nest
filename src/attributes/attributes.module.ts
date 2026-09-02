import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity.js';
import { AttributeValue } from './entities/attribute-value.entity.js';
import { AttributesService } from './attributes.service.js';
import {
  AttributesController,
  AttributeValuesController,
} from './attributes.controller.js';
import { AttributesSeedService } from './attributes.seed.service.js';
import { AttributeRepository } from './repositories/attribute.repository.js';
import { AttributeValueRepository } from './repositories/attribute-value.repository.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attribute, AttributeValue]),
    forwardRef(() => AuthModule),
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
    AttributeValueRepository,
    AttributeRepository,
  ],
})
export class AttributesModule {}
