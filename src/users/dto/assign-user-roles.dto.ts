import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class AssignUserRolesDto {
  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000040'],
    description:
      'شناسه نقش‌هایی که به کاربر اضافه می‌شوند (merge؛ نقش‌های فعلی حفظ می‌شوند)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsULID({ each: true })
  roleIds: string[];

  @ApiPropertyOptional({
    example: false,
    description:
      'اگر true باشد، اولین آیتم roleIds نقش اصلی می‌شود و نقش اصلی فعلی به extras می‌رود',
  })
  @IsOptional()
  @IsBoolean()
  makePrimary?: boolean;

  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description:
      'اختیاری — اگر نقش seller/super-seller اضافه شود و کاربر sellerId نداشته باشد، این فروشنده لینک می‌شود. در غیر این صورت seller مینیمال ساخته می‌شود',
  })
  @IsOptional()
  @IsULID()
  sellerId?: string;
}
