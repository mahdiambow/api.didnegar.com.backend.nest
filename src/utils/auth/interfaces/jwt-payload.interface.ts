export interface JwtPayload {
  sub: string;
  role: string;
  roles: string[];
  sellerId: string | null;
  adminId: string | null;
  type: 'access' | 'refresh';
}
