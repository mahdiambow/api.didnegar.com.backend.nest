export interface JwtPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}
