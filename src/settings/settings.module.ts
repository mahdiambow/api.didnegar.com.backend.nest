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
import { AboutUs } from './entities/about-us.entity.js';
import { AboutUsController } from './about-us.controller.js';
import { ContactSettings } from './entities/contact-settings.entity.js';
import { ContactSettingsController } from './contact-settings.controller.js';
import { ContactMessage } from './entities/contact-message.entity.js';
import { ContactMessagesController } from './contact-messages.controller.js';
import { ContactMessagesService } from './contact-messages.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      FooterSettings,
      HeaderSettings,
      AboutUs,
      ContactSettings,
      ContactMessage,
      Banner,
      Category,
    ]),
  ],
  controllers: [
    SettingsController,
    HeaderSettingsController,
    AboutUsController,
    ContactSettingsController,
    ContactMessagesController,
    BannersController,
  ],
  providers: [SettingsService, BannersService, ContactMessagesService],
  exports: [SettingsService, ContactMessagesService],
})
export class SettingsModule {}
