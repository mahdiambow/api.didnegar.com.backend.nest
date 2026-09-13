import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerContract } from '../entities/seller-contract.entity.js';

export class SellerContractResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  sellerId: string | null;

  @ApiProperty({ example: 'فروشگاه نمونه' })
  sellerName: string;

  @ApiProperty({
    type: [String],
    example: ['01JEX000000000000000000120'],
  })
  userIds: string[];

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
    userIds: contract.userIds,
    contractPartyName: contract.contractPartyName,
    description: contract.description,
    contractDate: toIsoString(contract.contractDate),
    createdAt: toIsoString(contract.createdAt),
    updatedAt: toIsoString(contract.updatedAt),
  };
}
