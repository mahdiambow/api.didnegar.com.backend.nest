import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      method?: string;
      url?: string;
      headers?: Record<string, string | undefined>;
    }>();
    const auth = req.headers?.authorization;
    const hasBearer =
      typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ');
    this.logger.warn(
      `[JWT] ${req.method} ${req.url} authHeader=${hasBearer ? 'Bearer ***' : auth ? 'present-not-bearer' : 'MISSING'}`,
    );
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser, info: Error | string | null): TUser {
    if (err || !user) {
      const reason =
        (info && typeof info === 'object' && 'message' in info
          ? (info as Error).message
          : typeof info === 'string'
            ? info
            : null) ||
        err?.message ||
        'No user from JWT strategy';
      this.logger.warn(`[JWT] rejected: ${reason}`);
      throw err || new UnauthorizedException(reason || 'Unauthorized');
    }
    const u = user as { sub?: string; sellerId?: string | null; role?: string };
    this.logger.log(
      `[JWT] ok sub=${u.sub} role=${u.role} sellerId=${u.sellerId ?? 'null'}`,
    );
    return user;
  }
}
