import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { User } from './entities/user.entity.js';
import { UserProfile } from './entities/user-profile.entity.js';
import { UserAddress } from './entities/user-address.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserAddress, RefreshToken]),
    forwardRef(() => RolesModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
