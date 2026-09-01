import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerContract } from '../entities/seller-contract.entity.js';

export class SellerContractResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty({ example: 'فروشگاه نمونه' })
  sellerName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  adminId: string;

  @ApiProperty({ example: 'شرکت طرف قرارداد' })
  contractPartyName: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  contractDate: string;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  updatedAt: string;
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toSellerContractResponse(
  contract: SellerContract,
): SellerContractResponseDto {
  return {
    id: contract.id,
    sellerId: contract.sellerId,
    sellerName: contract.sellerName,
    adminId: contract.adminId,
    contractPartyName: contract.contractPartyName,
    description: contract.description,
    contractDate: toIsoString(contract.contractDate),
    createdAt: toIsoString(contract.createdAt),
    updatedAt: toIsoString(contract.updatedAt),
  };
}
