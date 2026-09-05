import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity.js';
import type { UserProfile } from '../entities/user-profile.entity.js';
import type { UserAddress } from '../entities/user-address.entity.js';

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

export class UserProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: '0012345678', nullable: true })
  nationalCode: string | null;

  @ApiPropertyOptional({ example: '1995-01-01', nullable: true })
  birthDate: Date | null;
}

export class UserAddressResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'منزل' })
  title: string;

  @ApiProperty({ example: 'تهران' })
  province: string;

  @ApiProperty({ example: 'تهران' })
  city: string;

  @ApiProperty({ example: 'خیابان ولیعصر، پلاک ۱۰' })
  addressDetail: string;

  @ApiProperty({ example: '1234567890' })
  postalCode: string;

  @ApiPropertyOptional({ nullable: true })
  plaque: string | null;

  @ApiPropertyOptional({ nullable: true })
  unit: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  lat: number | null;

  @ApiPropertyOptional({ nullable: true })
  long: number | null;

  @ApiProperty({ example: 'کاربر نمونه' })
  recipientFullName: string;

  @ApiProperty({ example: '09333333333' })
  recipientPhone: string;

  @ApiProperty({ example: true })
  isDefault: boolean;
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

  @ApiPropertyOptional({ type: UserSellerSummaryDto, nullable: true })
  seller: UserSellerSummaryDto | null;

  @ApiPropertyOptional({ type: UserProfileResponseDto, nullable: true })
  profile: UserProfileResponseDto | null;

  @ApiPropertyOptional({ type: [UserAddressResponseDto] })
  addresses: UserAddressResponseDto[];

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
    profile: user.profile ? toUserProfileResponse(user.profile) : null,
    addresses: (user.addresses ?? []).map(toUserAddressResponse),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toUserProfileResponse(profile: UserProfile): UserProfileResponseDto {
  return {
    id: profile.id,
    nationalCode: profile.nationalCode,
    birthDate: profile.birthDate,
  };
}

function toUserAddressResponse(address: UserAddress): UserAddressResponseDto {
  return {
    id: address.id,
    title: address.title,
    province: address.province,
    city: address.city,
    addressDetail: address.addressDetail,
    postalCode: address.postalCode,
    plaque: address.plaque,
    unit: address.unit,
    description: address.description,
    lat: address.lat !== null ? Number(address.lat) : null,
    long: address.long !== null ? Number(address.long) : null,
    recipientFullName: address.recipientFullName,
    recipientPhone: address.recipientPhone,
    isDefault: address.isDefault,
  };
}
