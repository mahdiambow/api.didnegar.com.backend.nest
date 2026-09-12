import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { mediaConfig } from './media.config.js';
import { MediaService } from './media.service.js';

@Injectable()
export class MediaCleanupCron {
  private readonly logger = new Logger(MediaCleanupCron.name);

  constructor(private readonly mediaService: MediaService) {}

  @Cron(mediaConfig.cleanupCron, { timeZone: mediaConfig.cleanupTz })
  async handleCleanup() {
    this.logger.log('Starting expired media cleanup');
    const result = await this.mediaService.cleanupExpired();
    this.logger.log(`Cleanup finished: deleted=${result.deleted}`);
  }
}
