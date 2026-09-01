import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Seller } from '../entities/seller.entity.js';
import { BusinessType, SellerStatus } from '../entities/seller.enums.js';

export class SellerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty({ enum: BusinessType })
  businessType: BusinessType;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  nationalId: string | null;

  @ApiPropertyOptional()
  registrationNumber: string | null;

  @ApiPropertyOptional()
  address: string | null;

  @ApiPropertyOptional()
  city: string | null;

  @ApiPropertyOptional()
  postalCode: string | null;

  @ApiProperty({ enum: SellerStatus })
  status: SellerStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    nullable: true,
  })
  contractId: string | null;

  @ApiProperty({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440001'],
  })
  adminIds: string[];
}

export function toSellerResponse(
  seller: Seller,
  relations: { contractId?: string | null; adminIds?: string[] } = {},
): SellerResponseDto {
  return {
    id: seller.id,
    name: seller.name,
    slug: seller.slug,
    businessName: seller.businessName,
    businessType: seller.businessType,
    email: seller.email,
    phone: seller.phone,
    nationalId: seller.nationalId,
    registrationNumber: seller.registrationNumber,
    address: seller.address,
    city: seller.city,
    postalCode: seller.postalCode,
    status: seller.status,
    createdAt: seller.createdAt,
    updatedAt: seller.updatedAt,
    contractId: relations.contractId ?? null,
    adminIds: relations.adminIds ?? [],
  };
}
