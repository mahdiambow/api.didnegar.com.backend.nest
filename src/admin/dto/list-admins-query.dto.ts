import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListAdminsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'پشتیبانی' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
