import { Category } from '../categories/entities/category.entity.js';
import { Banner } from './entities/banner.entity.js';
import { BannersController } from './banners.controller.js';
import { BannersService } from './banners.service.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { FooterSettings } from './entities/footer-settings.entity.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

import { HeaderSettings } from './entities/header-settings.entity.js';
import { HeaderSettingsController } from './header-settings.controller.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      FooterSettings,
      HeaderSettings,
      Banner,
      Category,
    ]),
  ],
  controllers: [
    SettingsController,
    HeaderSettingsController,
    BannersController,
  ],
  providers: [SettingsService, BannersService],
  exports: [SettingsService],
})
export class SettingsModule {}
