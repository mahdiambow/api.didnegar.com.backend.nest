import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Rate-limit media uploads per seller (JWT) or IP. */
@Injectable()
export class MediaThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const sellerId = req.user?.sellerId;
    if (typeof sellerId === 'string' && sellerId.length > 0) {
      return Promise.resolve(`media-upload:seller:${sellerId}`);
    }
    return Promise.resolve(`media-upload:ip:${req.ip ?? 'unknown'}`);
  }
}
