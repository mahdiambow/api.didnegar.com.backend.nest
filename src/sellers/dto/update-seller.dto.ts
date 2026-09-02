import { PartialType } from '@nestjs/swagger';
import { CreateSellerDto } from './create-seller.dto.js';

export class UpdateSellerDto extends PartialType(CreateSellerDto) {}
