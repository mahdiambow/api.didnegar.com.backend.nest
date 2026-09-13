import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '0936',
    description: 'جستجو روی username / displayName / email / firstName / lastName',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
