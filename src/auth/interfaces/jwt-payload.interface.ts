export interface JwtPayload {
  sub: string;
  role: string;
  roles: string[];
  sellerId: string | null;
  type: 'access' | 'refresh';
}
