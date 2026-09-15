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
import { AuthService } from '../utils/auth/auth.service.js';
import { LoginOrSignupDto } from '../utils/auth/dto/login-or-signup.dto.js';
import { LoginOrSignupApiResponseDto } from '../utils/auth/dto/login-or-signup-response.dto.js';
import { VerifyOtpDto } from '../utils/auth/dto/verify-otp.dto.js';
import { VerifyOtpApiResponseDto } from '../utils/auth/dto/verify-otp-response.dto.js';
import { ValidateTokenDto } from '../utils/auth/dto/validate-token.dto.js';
import { ValidateTokenApiResponseDto } from '../utils/auth/dto/validate-token-response.dto.js';
import { SetPasswordDto } from '../utils/auth/dto/set-password.dto.js';
import { SetPasswordApiResponseDto } from '../utils/auth/dto/set-password-response.dto.js';
import { LoginWithPasswordDto } from '../utils/auth/dto/login-with-password.dto.js';
import { LoginWithPasswordApiResponseDto } from '../utils/auth/dto/login-with-password-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { AuthThrottlerGuard } from '../utils/auth/guards/auth-throttler.guard.js';
import {
  LoginThrottle,
  OtpSendThrottle,
  OtpVerifyThrottle,
} from '../utils/auth/decorators/auth-throttle.decorator.js';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-or-signup')
  @OtpSendThrottle()
  @UseGuards(AuthThrottlerGuard)
  @ApiResponseMeta({
    code: 'OTP_SENT',
    message: 'OTP sent successfully',
  })
  @ApiOperation({
    summary: 'ورود ادمین با موبایل و ارسال OTP',
    description: 'فقط حساب‌های با نقش admin / super-admin',
  })
  @ApiBody({ type: LoginOrSignupDto })
  @ApiOkResponse({ type: LoginOrSignupApiResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  loginOrSignup(@Body() dto: LoginOrSignupDto) {
    return this.authService.loginOrSignup(dto.mobile, 'admin');
  }

  @Post('verify-otp')
  @OtpVerifyThrottle()
  @UseGuards(AuthThrottlerGuard)
  @ApiResponseMeta({
    code: 'OTP_VERIFIED',
    message: 'OTP verified successfully',
  })
  @ApiOperation({ summary: 'تایید OTP ادمین و دریافت token' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({ type: VerifyOtpApiResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.mobile, dto.code, 'admin');
  }

  @Post('login-with-password')
  @LoginThrottle()
  @UseGuards(AuthThrottlerGuard)
  @ApiResponseMeta({
    code: 'LOGIN_SUCCESS',
    message: 'Logged in successfully',
  })
  @ApiOperation({
    summary: 'ورود ادمین با موبایل و رمز عبور',
    description: 'نمونه سوپرادمین: 09363078987',
  })
  @ApiBody({ type: LoginWithPasswordDto })
  @ApiOkResponse({ type: LoginWithPasswordApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  loginWithPassword(@Body() dto: LoginWithPasswordDto) {
    return this.authService.loginWithPassword(dto.mobile, dto.password, 'admin');
  }

  @Post('validate-token') //TODO: Create a hashcode in response login-or-signup for validate token
  @ApiResponseMeta({
    code: 'TOKEN_VALIDATED',
    message: 'Token validated successfully',
  })
  @ApiOperation({ summary: 'اعتبارسنجی token پورتال ادمین' })
  @ApiBody({ type: ValidateTokenDto })
  @ApiOkResponse({ type: ValidateTokenApiResponseDto })
  validateToken(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(
      dto.accessToken,
      dto.refreshToken,
      'admin',
    );
  }

  @UseGuards(JwtAuthGuard, AuthThrottlerGuard)
  @Post('set-password')
  @ApiResponseMeta({
    code: 'PASSWORD_SET',
    message: 'Password set successfully',
  })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'تنظیم رمز عبور ادمین لاگین‌شده' })
  @ApiBody({ type: SetPasswordDto })
  @ApiOkResponse({ type: SetPasswordApiResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  setPassword(
    @Req() req: { user: { sub: string } },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user.sub, dto.password, 'admin');
  }
}
