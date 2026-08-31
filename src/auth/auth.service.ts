import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { ApiException } from '../common/exceptions/api.exception.js';
import { User } from './entities/user.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { toUserResponse } from './dto/user-response.dto.js';
import { RolesSeedService } from '../roles/roles.seed.service.js';

const OTP_TTL_MINUTES = 2;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';

@Injectable()
export class AuthService {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly devOtpCode = process.env.OTP_STATIC_CODE ?? '123456';

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly rolesSeedService: RolesSeedService,
  ) {}

  async loginOrSignup(mobile: string) {
    let user = await this.userRepo.findOne({ where: { username: mobile } });

    if (!user) {
      const defaultRole = await this.rolesSeedService.getDefaultUserRole();
      user = this.userRepo.create({
        username: mobile,
        isActive: true,
        roleId: defaultRole.id,
      });
      user = await this.userRepo.save(user);
    }

    const code = this.isProduction
      ? this.generateRandomOtpCode()
      : this.devOtpCode;

    const hashedCode = await bcrypt.hash(code, 10);

    await this.userRepo.update(user.id, {
      otpCode: hashedCode,
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });

    if (this.isProduction) {
      await this.sendOtpSms(mobile, code);
    }

    return {
      ...(this.isProduction ? {} : { code }),
      isNewUser: !user.password,
      expiresIn: OTP_TTL_MINUTES * 60,
    };
  }

  async loginWithPassword(mobile: string, password: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :mobile', { mobile })
      .getOne();

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

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        'شماره موبایل یا رمز عبور نادرست است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.issueTokens(user.id, user.role.slug);

    return {
      user: toUserResponse(user),
      ...tokens,
    };
  }

  async verifyOtp(mobile: string, code: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect(['user.otpCode', 'user.otpExpiresAt', 'user.password'])
      .where('user.username = :mobile', { mobile })
      .getOne();

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

    await this.userRepo.update(user.id, {
      otpCode: null,
      otpExpiresAt: null,
      isActive: true,
    });

    const tokens = await this.issueTokens(user.id, user.role.slug);

    return {
      userId: user.id,
      role: user.role.slug,
      hasPassword: !!user.password,
      ...tokens,
    };
  }

  async validateToken(accessToken: string, refreshToken?: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken);
      if (payload.type !== 'access') {
        throw new ApiException(
          'INVALID_TOKEN',
          'توکن نامعتبر است',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new ApiException(
          'USER_NOT_FOUND',
          'کاربر یافت نشد یا غیرفعال است',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        valid: true,
        refreshed: false,
        userId: user.id,
        role: user.role.slug,
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

      const refreshed = await this.refreshTokens(refreshToken);
      return {
        valid: true,
        refreshed: true,
        userId: refreshed.userId,
        role: refreshed.role,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
      };
    }
  }

  async refreshTokens(refreshTokenRaw: string) {
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
    const storedToken = await this.refreshTokenRepo.findOne({
      where: {
        userId: payload.sub,
        tokenHash,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!storedToken) {
      throw new ApiException(
        'INVALID_REFRESH_TOKEN',
        'refreshToken یافت نشد یا باطل شده است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.refreshTokenRepo.update(storedToken.id, { revoked: true });

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد یا غیرفعال است',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.issueTokens(user.id, user.role.slug);
    return { userId: user.id, role: user.role.slug, ...tokens };
  }

  async setPassword(userId: string, password: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepo.update(userId, { password: hashedPassword });

    const updatedUser = await this.userRepo.findOne({ where: { id: userId } });
    if (!updatedUser) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return toUserResponse(updatedUser);
  }

  private async sendOtpSms(mobile: string, code: string): Promise<void> {
    // TODO: اتصال به سرویس پیامک واقعی
    console.log(`[SMS] ارسال کد ${code} به شماره ${mobile}`);
  }

  private async issueTokens(userId: string, roleSlug: string) {
    const accessPayload: JwtPayload = {
      sub: userId,
      role: roleSlug,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: userId,
      role: roleSlug,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: REFRESH_TOKEN_TTL,
    });

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
    );

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateRandomOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
