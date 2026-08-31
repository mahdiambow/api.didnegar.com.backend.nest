import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordResponseDto {
  @ApiProperty({ example: true, description: 'نتیجه تنظیم رمز عبور' })
  success: boolean;
}
