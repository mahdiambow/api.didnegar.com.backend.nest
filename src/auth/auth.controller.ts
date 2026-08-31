import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginOrSignupDto } from './dto/login-or-signup.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // مرحله ۱: ورود/ثبت‌نام با شماره موبایل -> ارسال OTP
  @Post('login-or-signup')
  loginOrSignup(@Body() dto: LoginOrSignupDto) {
    return this.authService.loginOrSignup(dto.mobile);
  }

  // مرحله ۲: تایید کد ۶ رقمی -> صدور accessToken/refreshToken
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.otpToken, dto.code);
  }

  // اعتبارسنجی توکن؛ در صورت منقضی بودن با استفاده از refreshToken تمدید می‌شود
  @Post('validate-token')
  validateToken(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto.accessToken, dto.refreshToken);
  }

  // تنظیم رمز عبور برای کاربر لاگین‌شده
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  setPassword(@Req() req: any, @Body() dto: SetPasswordDto) {
    return this.authService.setPassword(req.user.sub, dto.password);
  }
}
