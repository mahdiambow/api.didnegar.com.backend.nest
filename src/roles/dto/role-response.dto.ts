import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../entities/role.entity.js';
import { RoleAudience } from '../role-audience.enum.js';

export class RoleResponseDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  id: string;

  @ApiProperty({
    example: 'super-seller',
    description:
      'نقش‌های سیستمی: user | seller | super-seller | admin | super-admin',
  })
  slug: string;

  @ApiProperty({ example: 'سوپر فروشنده' })
  name: string;

  @ApiProperty({ example: ['users:read'], type: [String] })
  permissions: string[];

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({
    enum: RoleAudience,
    example: RoleAudience.SELLER,
    description: 'حوزه نقش — فقط نقش‌های هم‌حوزه روی یک کاربر ترکیب می‌شوند',
  })
  audience: RoleAudience;

  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
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
    audience: role.audience,
    sellerId: role.sellerId,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
