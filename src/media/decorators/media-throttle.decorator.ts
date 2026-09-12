import { Throttle } from '@nestjs/throttler';
import { mediaConfig } from '../media.config.js';

export const MediaUploadThrottle = () =>
  Throttle({
    [mediaConfig.uploadRate.name]: {
      limit: mediaConfig.uploadRate.limit,
      ttl: mediaConfig.uploadRate.ttl,
    },
  });
