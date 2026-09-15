import { Throttle } from '@nestjs/throttler';
import { authThrottler } from '../config/auth.config.js';

export const OtpSendThrottle = () =>
  Throttle({
    [authThrottler.otpSend.name]: {
      limit: authThrottler.otpSend.limit,
      ttl: authThrottler.otpSend.ttl,
    },
  });

export const OtpVerifyThrottle = () =>
  Throttle({
    [authThrottler.otpVerify.name]: {
      limit: authThrottler.otpVerify.limit,
      ttl: authThrottler.otpVerify.ttl,
    },
  });

export const LoginThrottle = () =>
  Throttle({
    [authThrottler.login.name]: {
      limit: authThrottler.login.limit,
      ttl: authThrottler.login.ttl,
    },
  });
