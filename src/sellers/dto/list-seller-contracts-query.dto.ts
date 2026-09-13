import { IsULID } from '../../common/id/index.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListSellerContractsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  sellerId?: string;
}
