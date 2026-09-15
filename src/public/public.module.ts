import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { ProductsModule } from '../products/products.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { PublicController } from './public.controller.js';

@Module({
  imports: [SettingsModule, ProductsModule, CategoriesModule],
  controllers: [PublicController],
})
export class PublicModule {}
