import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ALL_PERMISSIONS } from '../permissions.js';
import { IsPermissionArray } from '../validators/is-permission.validator.js';

export class CreateRoleDto {
  @ApiProperty({ example: 'editor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط می‌تواند شامل حروف کوچک، عدد و - باشد',
  })
  slug: string;

  @ApiProperty({ example: 'ویرایشگر' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: ['users:read', 'users:update'],
    enum: ALL_PERMISSIONS,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsPermissionArray()
  permissions: string[];

  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'فقط super-admin می‌تواند sellerId تعیین کند',
  })
  @IsOptional()
  @IsULID()
  sellerId?: string;
}
