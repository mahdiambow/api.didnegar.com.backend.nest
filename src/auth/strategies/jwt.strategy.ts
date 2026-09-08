import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { resolveUserRoles } from '../types/auth-user.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const roles = resolveUserRoles(payload.role, payload.roles ?? []);

    return {
      sub: payload.sub,
      role: payload.role,
      roles,
      sellerId: payload.sellerId ?? null,
    };
  }
}
