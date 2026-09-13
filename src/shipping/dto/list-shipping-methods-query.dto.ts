import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListShippingMethodsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: true,
    description: 'فیلتر روش‌های فعال — بدون این پارامتر همه برگردانده می‌شوند',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
