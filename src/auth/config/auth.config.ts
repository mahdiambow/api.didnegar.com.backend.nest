function parseDurationMs(value: string): number {
  const match = value.trim().match(/^(\d+)([smhd])$/);
  if (!match) {
    return 0;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

export const authConfig = {
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 2),
  accessTokenTtl: (process.env.ACCESS_TOKEN_TTL ?? '15m') as
    | `${number}s`
    | `${number}m`
    | `${number}h`
    | `${number}d`,
  refreshTokenTtl: (process.env.REFRESH_TOKEN_TTL ?? '30d') as
    | `${number}s`
    | `${number}m`
    | `${number}h`
    | `${number}d`,
  otpSendLimit: Number(process.env.OTP_SEND_LIMIT ?? 1),
  otpVerifyLimit: Number(process.env.OTP_VERIFY_LIMIT ?? 5),
  loginLimit: Number(process.env.LOGIN_LIMIT ?? 5),
} as const;

export function otpTtlMs(): number {
  return authConfig.otpTtlMinutes * 60 * 1000;
}

export function refreshTokenExpiresAt(): Date {
  const ttlMs = parseDurationMs(authConfig.refreshTokenTtl);
  return new Date(Date.now() + (ttlMs || 30 * 24 * 60 * 60 * 1000));
}

export const authThrottler = {
  otpSend: {
    name: 'otp-send',
    ttl: otpTtlMs(),
    limit: authConfig.otpSendLimit,
  },
  otpVerify: {
    name: 'otp-verify',
    ttl: otpTtlMs(),
    limit: authConfig.otpVerifyLimit,
  },
  login: {
    name: 'login',
    ttl: otpTtlMs(),
    limit: authConfig.loginLimit,
  },
} as const;
