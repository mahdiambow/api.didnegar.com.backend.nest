import { UserRole } from '../enums/user-role.enum.js';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface OtpTokenPayload {
  sub: string;
  mobile: string;
  purpose: 'otp';
}
