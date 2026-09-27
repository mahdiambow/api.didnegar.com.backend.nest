import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleResponseDto } from '../../roles/dto/role-response.dto.js';

export class UserRolesResponseDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  userId: string;

  @ApiProperty({ example: '09363078987' })
  username: string;

  @ApiProperty({ type: RoleResponseDto })
  primaryRole: RoleResponseDto;

  @ApiProperty({ type: [RoleResponseDto] })
  extraRoles: RoleResponseDto[];

  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000030', '01JEX000000000000000000040'],
    description: 'شناسه همه نقش‌ها — اولین مورد نقش اصلی است',
  })
  roleIds: string[];

  @ApiProperty({
    type: [String],
    example: ['super-admin', 'user', 'super-seller'],
    description: 'slug همه نقش‌ها',
  })
  roles: string[];

  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    nullable: true,
  })
  sellerId: string | null;

  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    nullable: true,
  })
  adminId: string | null;
}
