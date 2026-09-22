import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT اختیاری — بدون توکن هم رد می‌شود؛ با توکن نامعتبر هم user = null
 * (برای لیست‌های عمومی که برای صاحب داده، وضعیت بیشتری نشان می‌دهند).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      headers?: Record<string, string | undefined>;
    }>();
    const auth = req.headers?.authorization;
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info?: Error | string | null,
  ): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
