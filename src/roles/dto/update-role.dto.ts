import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ALL_PERMISSIONS } from '../permissions.js';
import { IsPermissionArray } from '../validators/is-permission.validator.js';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'editor' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط می‌تواند شامل حروف کوچک، عدد و - باشد',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'ویرایشگر' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: ['users:read'],
    enum: ALL_PERMISSIONS,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsPermissionArray()
  permissions?: string[];
}
