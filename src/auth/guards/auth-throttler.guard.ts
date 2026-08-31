import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const mobile = req.body?.mobile;
    if (typeof mobile === 'string' && mobile.length > 0) {
      return Promise.resolve(`auth:${mobile}`);
    }

    return Promise.resolve(req.ip ?? 'unknown');
  }
}
