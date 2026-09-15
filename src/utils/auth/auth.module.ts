import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RoleGuard } from './guards/role.guard.js';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard.js';
import { authThrottler } from './config/auth.config.js';
import { mediaConfig } from '../../media/media.config.js';
import { UserRepository } from './repositories/user.repository.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { User } from '../../users/entities/user.entity.js';
import { UserProfile } from '../../users/entities/user-profile.entity.js';
import { UserAddress } from '../../users/entities/user-address.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { ConfigService } from '../../config/config.service.js';
import { RolesModule } from '../../roles/roles.module.js';
import { ShoppingCartModule } from '../../shopping-cart/shopping-cart.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserAddress,
      RefreshToken,
    ]),
    forwardRef(() => RolesModule),
    forwardRef(() => ShoppingCartModule),
    ThrottlerModule.forRoot({
      throttlers: [
        authThrottler.otpSend,
        authThrottler.otpVerify,
        authThrottler.login,
        mediaConfig.uploadRate,
      ],
      errorMessage: 'تعداد درخواست بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PermissionsGuard,
    RoleGuard,
    AuthThrottlerGuard,
    UserRepository,
    RefreshTokenRepository,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    PermissionsGuard,
    RoleGuard,
    UserRepository,
    RefreshTokenRepository,
    ThrottlerModule,
  ],
})
export class AuthModule {}
