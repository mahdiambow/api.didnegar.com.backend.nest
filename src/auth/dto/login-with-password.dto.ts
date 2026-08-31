import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginWithPasswordDto {
  @ApiProperty({
    example: '09363078987',
    description: 'شماره موبایل',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  mobile: string;

  @ApiProperty({
    example: 'MySecurePass123',
    description: 'رمز عبور',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  password: string;
}
