import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
} from 'class-validator';

export class RevokeUserRolesDto {
  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000040'],
    description: 'شناسه نقش‌هایی که از کاربر حذف می‌شوند',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsULID({ each: true })
  roleIds: string[];

  @ApiPropertyOptional({
    example: '01JEX000000000000000000030',
    description:
      'اگر نقش اصلی در لیست حذف باشد، باید شناسه نقش جدید اصلی را بفرستید',
  })
  @IsOptional()
  @IsULID()
  newPrimaryRoleId?: string;
}
