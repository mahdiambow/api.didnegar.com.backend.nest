import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginOrSignupDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  mobile: string;
}
