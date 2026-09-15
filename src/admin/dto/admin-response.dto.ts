import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Admin } from '../entities/admin.entity.js';
import { UserResponseDto } from '../../utils/auth/dto/user-response.dto.js';

export class AdminResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000030'],
  })
  userIds: string[];

  @ApiPropertyOptional({ type: [UserResponseDto] })
  users?: UserResponseDto[];
}

export function toAdminResponse(
  admin: Admin,
  relations: {
    userIds?: string[];
    users?: UserResponseDto[];
  } = {},
): AdminResponseDto {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    userIds: relations.userIds ?? [],
    users: relations.users,
  };
}
