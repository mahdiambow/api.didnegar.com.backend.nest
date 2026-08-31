import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginOrSignupDto } from './dto/login-or-signup.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ValidateTokenDto } from './dto/validate-token.dto.js';
import { SetPasswordDto } from './dto/set-password.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-or-signup')
  loginOrSignup(@Body() dto: LoginOrSignupDto) {
    return this.authService.loginOrSignup(dto.mobile);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.otpToken, dto.code);
  }

  @Post('validate-token')
  validateToken(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto.accessToken, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  setPassword(@Req() req: { user: { sub: string } }, @Body() dto: SetPasswordDto) {
    return this.authService.setPassword(req.user.sub, dto.password);
  }
}
