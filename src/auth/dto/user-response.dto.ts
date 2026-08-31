import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum.js';
import { User } from '../entities/user.entity.js';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '09363078987' })
  username: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  email: string | null;

  @ApiPropertyOptional({ example: 'Tina' })
  displayName: string | null;

  @ApiPropertyOptional({ example: 'Tina' })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Ahmadi' })
  lastName: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  website: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: UserRole.USER, enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: '2026-08-31T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-31T12:00:00.000Z' })
  updatedAt: Date;
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    website: user.website,
    isActive: user.isActive,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
