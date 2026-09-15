import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { ApiException } from '../../common/exceptions/api.exception.js';
import { ConfigService } from '../../config/config.service.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { toUserResponse } from './dto/user-response.dto.js';
import { RolesSeedService } from '../../roles/roles.seed.service.js';
import { RoleRepository } from '../../roles/repositories/role.repository.js';
import { UserRepository } from './repositories/user.repository.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import {
  authConfig,
  otpTtlMs,
  refreshTokenExpiresAt,
} from './config/auth.config.js';
import { resolveUserRoles, userHasRole } from './types/auth-user.type.js';
import { User } from '../../users/entities/user.entity.js';
import { ShoppingCartService } from '../../shopping-cart/shopping-cart.service.js';
import {
  AUTH_PORTAL_ROLES,
  type AuthPortal,
} from './auth-portal.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly rolesSeedService: RolesSeedService,
    private readonly roleRepository: RoleRepository,
    @Inject(forwardRef(() => ShoppingCartService))
    private readonly shoppingCartService: ShoppingCartService,
    private readonly dataSource: DataSource,
  ) {}

  async loginOrSignup(mobile: string, portal: AuthPortal) {
    let user = await this.userRepository.findByUsername(mobile);

    if (!user) {
      if (portal !== 'user') {
        throw new ApiException(
          'USER_NOT_FOUND',
          'حساب کاربری یافت نشد. ثبت‌نام فقط از پورتال کاربر ممکن است',
          HttpStatus.NOT_FOUND,
        );
      }

      const defaultRole = await this.rolesSeedService.getDefaultUserRole();
      user = await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const created = await users.save(
          users.create({
            username: mobile,
            isActive: true,
            roleId: defaultRole.id,
          }),
        );
        await this.shoppingCartService.init(created.id, manager);
        return created;
      });
    } else {
      await this.assertPortalAccess(user, portal);
    }

    const code = this.config.get('OTP_STATIC_CODE');
    const hashedCode = await bcrypt.hash(code, 10);

    await this.userRepository.update(user.id, {
      otpCode: hashedCode,
      otpExpiresAt: new Date(Date.now() + otpTtlMs()),
    });

    if (this.config.get('NODE_ENV') === 'production') {
      await this.sendOtpSms(mobile, code);
    }

    return {
      code,
      isNewUser: !user.password,
      expiresIn: authConfig.otpTtlMinutes * 60,
    };
  }

  async loginWithPassword(
    mobile: string,
    password: string,
    portal: AuthPortal,
  ) {
    const user = await this.userRepository.findByUsernameWithPassword(mobile);

    if (!user || !user.password) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        'شماره موبایل یا رمز عبور نادرست است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isActive) {
      throw new ApiException(
        'USER_INACTIVE',
        'حساب کاربری غیرفعال است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.assertPortalAccess(user, portal);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        'شماره موبایل یا رمز عبور نادرست است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.issueTokensForUser(user);
    return {
      user: await this.toResponse(user),
      ...tokens,
    };
  }

  async verifyOtp(mobile: string, code: string, portal: AuthPortal) {
    const user = await this.userRepository.findByUsernameForOtpVerify(mobile);

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new ApiException(
        'OTP_REQUEST_NOT_FOUND',
        'درخواست کد معتبری یافت نشد',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new ApiException(
        'OTP_EXPIRED',
        'کد تایید منقضی شده است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isHashMatch = await bcrypt.compare(code, user.otpCode);
    if (!isHashMatch) {
      throw new ApiException(
        'INVALID_OTP',
        'کد تایید نادرست است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.assertPortalAccess(user, portal);

    await this.userRepository.update(user.id, {
      otpCode: null,
      otpExpiresAt: null,
      isActive: true,
    });

    const tokens = await this.issueTokensForUser(user);
    return {
      user: await this.toResponse(user),
      hasPassword: !!user.password,
      ...tokens,
    };
  }

  async validateToken(
    accessToken: string,
    refreshToken: string | undefined,
    portal: AuthPortal,
  ) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken);
      if (payload.type !== 'access') {
        throw new ApiException(
          'INVALID_TOKEN',
          'توکن نامعتبر است',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new ApiException(
          'USER_NOT_FOUND',
          'کاربر یافت نشد یا غیرفعال است',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.assertPortalAccess(user, portal);
      const roles = await this.resolveRoleSlugs(user);

      return {
        valid: true,
        refreshed: false,
        userId: user.id,
        role: user.role.slug,
        roles,
        sellerId: user.sellerId,
        adminId: user.adminId,
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      if (!refreshToken) {
        throw new ApiException(
          'REFRESH_TOKEN_REQUIRED',
          'توکن نامعتبر است و refreshToken ارسال نشده',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const refreshed = await this.refreshTokens(refreshToken, portal);
      return {
        valid: true,
        refreshed: true,
        userId: refreshed.userId,
        role: refreshed.role,
        roles: refreshed.roles,
        sellerId: refreshed.sellerId,
        adminId: refreshed.adminId,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
      };
    }
  }

  async refreshTokens(refreshTokenRaw: string, portal?: AuthPortal) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshTokenRaw);
    } catch {
      throw new ApiException(
        'INVALID_REFRESH_TOKEN',
        'refreshToken نامعتبر یا منقضی شده است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (payload.type !== 'refresh') {
      throw new ApiException(
        'INVALID_TOKEN',
        'نوع توکن نامعتبر است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenHash = this.hashToken(refreshTokenRaw);
    const storedToken = await this.refreshTokenRepository.findValidToken(
      payload.sub,
      tokenHash,
    );

    if (!storedToken) {
      throw new ApiException(
        'INVALID_REFRESH_TOKEN',
        'refreshToken یافت نشد یا باطل شده است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.refreshTokenRepository.revoke(storedToken.id);

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد یا غیرفعال است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (portal) {
      await this.assertPortalAccess(user, portal);
    }

    const roles = await this.resolveRoleSlugs(user);
    const tokens = await this.issueTokens(
      user.id,
      user.role.slug,
      roles,
      user.sellerId,
      user.adminId,
    );
    return {
      userId: user.id,
      role: user.role.slug,
      roles,
      sellerId: user.sellerId,
      adminId: user.adminId,
      ...tokens,
    };
  }

  async setPassword(userId: string, password: string, portal: AuthPortal) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.assertPortalAccess(user, portal);

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update(userId, { password: hashedPassword });

    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toResponse(updatedUser);
  }

  private async assertPortalAccess(user: User, portal: AuthPortal) {
    const roles = await this.resolveRoleSlugs(user);
    const allowed = AUTH_PORTAL_ROLES[portal];
    if (
      !userHasRole(
        { role: user.role.slug, roles },
        ...allowed,
      )
    ) {
      throw new ApiException(
        'PORTAL_ACCESS_DENIED',
        'دسترسی به این پورتال برای این حساب مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async sendOtpSms(mobile: string, code: string): Promise<void> {
    // TODO: اتصال به سرویس پیامک واقعی
    console.log(`[SMS] ارسال کد ${code} به شماره ${mobile}`);
  }

  private async toResponse(user: User) {
    const extraRoles = await this.roleRepository.findByIds(
      user.extraRoleIds ?? [],
    );
    return toUserResponse(user, extraRoles);
  }

  private async resolveRoleSlugs(user: User) {
    const extraRoles = await this.roleRepository.findByIds(
      user.extraRoleIds ?? [],
    );
    return resolveUserRoles(
      user.role.slug,
      extraRoles.map((role) => role.slug),
    );
  }

  private async issueTokensForUser(user: User) {
    const roles = await this.resolveRoleSlugs(user);
    return this.issueTokens(
      user.id,
      user.role.slug,
      roles,
      user.sellerId,
      user.adminId,
    );
  }

  private async issueTokens(
    userId: string,
    roleSlug: string,
    roles: string[],
    sellerId: string | null,
    adminId: string | null,
  ) {
    const accessPayload: JwtPayload = {
      sub: userId,
      role: roleSlug,
      roles,
      sellerId,
      adminId,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: userId,
      role: roleSlug,
      roles,
      sellerId,
      adminId,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: authConfig.accessTokenTtl,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: authConfig.refreshTokenTtl,
    });

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt(),
      }),
    );

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
