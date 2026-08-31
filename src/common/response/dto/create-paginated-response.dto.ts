import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto.js';

export function createPaginatedListDto<T>(itemDto: Type<T>, name: string) {
  class PaginatedListDto {
    @ApiProperty({ type: [itemDto] })
    items: T[];

    @ApiProperty({ type: PaginationMetaDto })
    pagination: PaginationMetaDto;
  }

  Object.defineProperty(PaginatedListDto, 'name', {
    value: `${name}PaginatedListDto`,
  });

  return PaginatedListDto;
}

export function createPaginatedResponseDto<T>(
  itemDto: Type<T>,
  options: { code: string; message: string; name: string },
) {
  const PaginatedListDto = createPaginatedListDto(itemDto, options.name);

  class PaginatedResponseDto {
    @ApiProperty({ example: options.code })
    code: string;

    @ApiProperty({ example: options.message })
    message: string;

    @ApiProperty({ type: PaginatedListDto })
    data: InstanceType<typeof PaginatedListDto>;
  }

  Object.defineProperty(PaginatedResponseDto, 'name', {
    value: `${options.name}PaginatedResponseDto`,
  });

  return PaginatedResponseDto;
}
