import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { User } from './entities/user.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { UserRole } from './enums/user-role.enum.js';
import {
  JwtPayload,
  OtpTokenPayload,
} from './interfaces/jwt-payload.interface.js';

const OTP_TTL_MINUTES = 2;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const OTP_TOKEN_TTL = '5m';

@Injectable()
export class AuthService {
  private readonly staticOtpCode: string | null;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.staticOtpCode =
      this.config.get<string>('OTP_STATIC_CODE') ?? '123456';
  }

  async loginOrSignup(mobile: string) {
    let user = await this.userRepo.findOne({ where: { username: mobile } });

    if (!user) {
      user = this.userRepo.create({
        username: mobile,
        isActive: true,
        role: UserRole.USER,
      });
      user = await this.userRepo.save(user);
    }

    const code = this.generateOtpCode();
    const hashedCode = await bcrypt.hash(code, 10);

    await this.userRepo.update(user.id, {
      otpCode: hashedCode,
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });

    // TODO: اتصال به سرویس پیامک واقعی برای ارسال کد
    console.log(`[OTP] ارسال کد ${code} به شماره ${mobile}`);

    const otpTokenPayload: OtpTokenPayload = {
      sub: user.id,
      mobile: user.username,
      purpose: 'otp',
    };

    const otpToken = this.jwtService.sign(otpTokenPayload, {
      expiresIn: OTP_TOKEN_TTL,
    });

    return {
      otpToken,
      isNewUser: !user.password,
      expiresIn: OTP_TTL_MINUTES * 60,
    };
  }

  async verifyOtp(otpToken: string, code: string) {
    let payload: OtpTokenPayload;
    try {
      payload = this.jwtService.verify<OtpTokenPayload>(otpToken);
    } catch {
      throw new UnauthorizedException('توکن OTP نامعتبر یا منقضی شده است');
    }

    if (payload.purpose !== 'otp') {
      throw new BadRequestException('توکن نامعتبر است');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
        otpCode: true,
        otpExpiresAt: true,
        password: true,
      },
    });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('درخواست کد معتبری یافت نشد');
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('کد تایید منقضی شده است');
    }

    const isStaticMatch = this.staticOtpCode && code === this.staticOtpCode;
    const isHashMatch = await bcrypt.compare(code, user.otpCode);

    if (!isStaticMatch && !isHashMatch) {
      throw new UnauthorizedException('کد تایید نادرست است');
    }

    await this.userRepo.update(user.id, {
      otpCode: null,
      otpExpiresAt: null,
      isActive: true,
    });

    const tokens = await this.issueTokens(user.id, user.role);

    return {
      userId: user.id,
      role: user.role,
      hasPassword: !!user.password,
      ...tokens,
    };
  }

  async validateToken(accessToken: string, refreshToken?: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken);
      if (payload.type !== 'access') {
        throw new UnauthorizedException('توکن نامعتبر است');
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('کاربر یافت نشد یا غیرفعال است');
      }

      return {
        valid: true,
        refreshed: false,
        userId: user.id,
        role: user.role,
      };
    } catch {
      if (!refreshToken) {
        throw new UnauthorizedException('توکن نامعتبر است و refreshToken ارسال نشده');
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
      throw new UnauthorizedException('refreshToken نامعتبر یا منقضی شده است');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('نوع توکن نامعتبر است');
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
      throw new UnauthorizedException('refreshToken یافت نشد یا باطل شده است');
    }

    await this.refreshTokenRepo.update(storedToken.id, { revoked: true });

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('کاربر یافت نشد یا غیرفعال است');
    }

    const tokens = await this.issueTokens(user.id, user.role);
    return { userId: user.id, role: user.role, ...tokens };
  }

  async setPassword(userId: string, password: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('کاربر یافت نشد');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepo.update(userId, { password: hashedPassword });

    return { success: true };
  }

  private async issueTokens(userId: string, role: UserRole) {
    const accessPayload: JwtPayload = { sub: userId, role, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, role, type: 'refresh' };

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

  private generateOtpCode(): string {
    if (this.staticOtpCode) {
      return this.staticOtpCode;
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
