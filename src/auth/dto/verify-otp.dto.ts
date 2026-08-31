import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  otpToken: string;

  @IsString()
  @Length(6, 6, { message: 'کد تایید باید ۶ رقم باشد' })
  code: string;
}
