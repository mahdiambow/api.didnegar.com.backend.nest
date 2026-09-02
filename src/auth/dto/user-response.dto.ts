import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity.js';

export class UserRoleSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'seller' })
  slug: string;

  @ApiProperty({ example: 'فروشنده' })
  name: string;
}

export class UserSellerSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'my-shop' })
  slug: string;

  @ApiProperty({ example: 'فروشگاه من' })
  name: string;
}

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

  @ApiProperty({ type: UserRoleSummaryDto })
  role: UserRoleSummaryDto;

  @ApiPropertyOptional({ type: UserSellerSummaryDto })
  seller: UserSellerSummaryDto | null;

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
    role: {
      id: user.role.id,
      slug: user.role.slug,
      name: user.role.name,
    },
    seller: user.seller
      ? {
          id: user.seller.id,
          slug: user.seller.slug,
          name: user.seller.name,
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
