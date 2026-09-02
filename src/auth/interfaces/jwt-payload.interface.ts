export interface JwtPayload {
  sub: string;
  role: string;
  sellerId: string | null;
  type: 'access' | 'refresh';
}
