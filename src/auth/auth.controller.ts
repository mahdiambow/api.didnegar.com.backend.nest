import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { ApiErrorResponseDto } from '../common/response/dto/api-error-response.dto.js';
import { AuthService } from './auth.service.js';
import { LoginOrSignupDto } from './dto/login-or-signup.dto.js';
import { LoginOrSignupApiResponseDto } from './dto/login-or-signup-response.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { VerifyOtpApiResponseDto } from './dto/verify-otp-response.dto.js';
import { ValidateTokenDto } from './dto/validate-token.dto.js';
import { ValidateTokenApiResponseDto } from './dto/validate-token-response.dto.js';
import { SetPasswordDto } from './dto/set-password.dto.js';
import { SetPasswordApiResponseDto } from './dto/set-password-response.dto.js';
import { LoginWithPasswordDto } from './dto/login-with-password.dto.js';
import { LoginWithPasswordApiResponseDto } from './dto/login-with-password-response.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard.js';
import {
  LoginThrottle,
  OtpSendThrottle,
  OtpVerifyThrottle,
} from './decorators/auth-throttle.decorator.js';

@ApiTags('Auth')
@UseGuards(AuthThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-or-signup')
  @OtpSendThrottle()
  @ApiResponseMeta({
    code: 'OTP_SENT',
    message: 'OTP sent successfully',
  })
  @ApiOperation({ summary: 'ورود / ثبت‌نام با شماره موبایل و ارسال OTP' })
  @ApiBody({ type: LoginOrSignupDto })
  @ApiOkResponse({ type: LoginOrSignupApiResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  loginOrSignup(@Body() dto: LoginOrSignupDto) {
    return this.authService.loginOrSignup(dto.mobile);
  }

  @Post('verify-otp')
 //@OtpVerifyThrottle()
  @ApiResponseMeta({
    code: 'OTP_VERIFIED',
    message: 'OTP verified successfully',
  })
  @ApiOperation({ summary: 'تایید کد OTP با شماره موبایل و دریافت token' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({ type: VerifyOtpApiResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.mobile, dto.code);
  }

  @Post('login-with-password')
  @LoginThrottle()
  @ApiResponseMeta({
    code: 'LOGIN_SUCCESS',
    message: 'Logged in successfully',
  })
  @ApiOperation({ summary: 'ورود با شماره موبایل و رمز عبور' })
  @ApiBody({ type: LoginWithPasswordDto })
  @ApiOkResponse({ type: LoginWithPasswordApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  loginWithPassword(@Body() dto: LoginWithPasswordDto) {
    return this.authService.loginWithPassword(dto.mobile, dto.password);
  }

  @Post('validate-token')
  @ApiResponseMeta({
    code: 'TOKEN_VALIDATED',
    message: 'Token validated successfully',
  })
  @ApiOperation({
    summary: 'اعتبارسنجی access token (با امکان refresh)',
  })
  @ApiBody({ type: ValidateTokenDto })
  @ApiOkResponse({ type: ValidateTokenApiResponseDto })
  validateToken(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto.accessToken, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  @ApiResponseMeta({
    code: 'PASSWORD_SET',
    message: 'Password set successfully',
  })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'تنظیم رمز عبور برای کاربر لاگین‌شده' })
  @ApiBody({ type: SetPasswordDto })
  @ApiOkResponse({ type: SetPasswordApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  setPassword(
    @Req() req: { user: { sub: string } },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user.sub, dto.password);
  }
}
