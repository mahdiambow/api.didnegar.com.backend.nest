import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { Product } from '../products/entities/product.entity.js';
import { Seller } from '../sellers/entities/seller.entity.js';
import { SellersModule } from '../sellers/sellers.module.js';
import { MediaAsset } from './entities/media-asset.entity.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { MediaStorageService } from './media.storage.service.js';
import { MediaSftpService } from './media.sftp.service.js';
import { MediaCleanupCron } from './media.cleanup.cron.js';
import { MediaThrottlerGuard } from './guards/media-throttler.guard.js';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => SellersModule),
    TypeOrmModule.forFeature([MediaAsset, Seller, Product]),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaStorageService,
    MediaSftpService,
    MediaCleanupCron,
    MediaThrottlerGuard,
  ],
  exports: [MediaService],
})
export class MediaModule {}
