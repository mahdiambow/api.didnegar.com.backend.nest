import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../utils/auth/dto/user-response.dto.js';
import { Seller } from '../entities/seller.entity.js';
import { BusinessType, SellerStatus } from '../entities/seller.enums.js';
import { SellerContractResponseDto } from './seller-contract-response.dto.js';

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
    example: '01JEX000000000000000000040',
    nullable: true,
  })
  contractId: string | null;

  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000030'],
  })
  adminIds: string[];

  @ApiProperty({ type: [UserResponseDto] })
  admins: UserResponseDto[];

  @ApiPropertyOptional({ type: SellerContractResponseDto, nullable: true })
  contract: SellerContractResponseDto | null;
}

export function toSellerResponse(
  seller: Seller,
  relations: {
    contractId?: string | null;
    adminIds?: string[];
    admins?: UserResponseDto[];
    contract?: SellerContractResponseDto | null;
  } = {},
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
    contractId: relations.contractId ?? relations.contract?.id ?? null,
    adminIds: relations.adminIds ?? relations.admins?.map((admin) => admin.id) ?? [],
    admins: relations.admins ?? [],
    contract: relations.contract ?? null,
  };
}

/** پاسخ لیست فروشنده — بدون PII سنگین، قرارداد و ادمین‌ها */
export class SellerListItemDto {
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
  city: string | null;

  @ApiProperty({ enum: SellerStatus })
  status: SellerStatus;

  @ApiProperty()
  createdAt: Date;
}

export function toSellerListResponse(seller: Seller): SellerListItemDto {
  return {
    id: seller.id,
    name: seller.name,
    slug: seller.slug,
    businessName: seller.businessName,
    businessType: seller.businessType,
    email: seller.email,
    phone: seller.phone,
    city: seller.city ?? null,
    status: seller.status,
    createdAt: seller.createdAt,
  };
}
