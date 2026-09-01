import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSellerContractDto } from './create-seller-contract.dto.js';

export class UpdateSellerContractDto extends PartialType(
  OmitType(CreateSellerContractDto, ['sellerId'] as const),
) {}
