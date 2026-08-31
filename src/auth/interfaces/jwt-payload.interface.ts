import { UserRole } from '../enums/user-role.enum.js';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  type: 'access' | 'refresh';
}
