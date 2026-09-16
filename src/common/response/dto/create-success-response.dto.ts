import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export function createSuccessResponseDto<T>(
  dataDto: Type<T>,
  options: {
    code: string;
    message: string;
    name: string;
    /** وقتی data آرایه است (مثل لیست پابلیک) */
    isArray?: boolean;
  },
) {
  class SuccessResponseDto {
    @ApiProperty({ example: options.code })
    code: string;

    @ApiProperty({ example: options.message })
    message: string;

    @ApiProperty(
      options.isArray
        ? { type: dataDto, isArray: true }
        : { type: dataDto },
    )
    data: T | T[];
  }

  Object.defineProperty(SuccessResponseDto, 'name', {
    value: `${options.name}SuccessResponseDto`,
  });

  return SuccessResponseDto;
}
