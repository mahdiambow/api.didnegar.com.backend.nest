import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginOrSignupDto } from './dto/login-or-signup.dto.js';
import { LoginOrSignupResponseDto } from './dto/login-or-signup-response.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { VerifyOtpResponseDto } from './dto/verify-otp-response.dto.js';
import { ValidateTokenDto } from './dto/validate-token.dto.js';
import { ValidateTokenResponseDto } from './dto/validate-token-response.dto.js';
import { SetPasswordDto } from './dto/set-password.dto.js';
import { SetPasswordResponseDto } from './dto/set-password-response.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-or-signup')
  @ApiOperation({ summary: 'ورود / ثبت‌نام با شماره موبایل و ارسال OTP' })
  @ApiBody({ type: LoginOrSignupDto })
  @ApiOkResponse({ type: LoginOrSignupResponseDto })
  loginOrSignup(@Body() dto: LoginOrSignupDto) {
    return this.authService.loginOrSignup(dto.mobile);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'تایید کد OTP با شماره موبایل و دریافت token' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({ type: VerifyOtpResponseDto })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.mobile, dto.code);
  }

  @Post('validate-token')
  @ApiOperation({
    summary: 'اعتبارسنجی access token (با امکان refresh)',
  })
  @ApiBody({ type: ValidateTokenDto })
  @ApiOkResponse({ type: ValidateTokenResponseDto })
  validateToken(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto.accessToken, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'تنظیم رمز عبور برای کاربر لاگین‌شده' })
  @ApiBody({ type: SetPasswordDto })
  @ApiOkResponse({ type: SetPasswordResponseDto })
  @ApiUnauthorizedResponse({ description: 'توکن نامعتبر یا ارسال نشده' })
  setPassword(
    @Req() req: { user: { sub: string } },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user.sub, dto.password);
  }
}
