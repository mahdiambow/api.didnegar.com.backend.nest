import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../entities/role.entity.js';

export class RoleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'editor' })
  slug: string;

  @ApiProperty({ example: 'ویرایشگر' })
  name: string;

  @ApiProperty({ example: ['users:read'], type: [String] })
  permissions: string[];

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  sellerId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toRoleResponse(role: Role): RoleResponseDto {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    permissions: role.permissions,
    isSystem: role.isSystem,
    sellerId: role.sellerId,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
