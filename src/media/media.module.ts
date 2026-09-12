import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Product } from '../products/entities/product.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { MediaAsset } from './entities/media-asset.entity.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { MediaStorageService } from './media.storage.service.js';
import { MediaCleanupCron } from './media.cleanup.cron.js';
import { MediaThrottlerGuard } from './guards/media-throttler.guard.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([MediaAsset, Seller, Product]),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaStorageService,
    MediaCleanupCron,
    MediaThrottlerGuard,
  ],
  exports: [MediaService],
})
export class MediaModule {}
