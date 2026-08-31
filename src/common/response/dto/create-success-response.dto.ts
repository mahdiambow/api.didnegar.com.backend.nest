import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export function createSuccessResponseDto<T>(
  dataDto: Type<T>,
  options: { code: string; message: string; name: string },
) {
  class SuccessResponseDto {
    @ApiProperty({ example: options.code })
    code: string;

    @ApiProperty({ example: options.message })
    message: string;

    @ApiProperty({ type: dataDto })
    data: T;
  }

  Object.defineProperty(SuccessResponseDto, 'name', {
    value: `${options.name}SuccessResponseDto`,
  });

  return SuccessResponseDto;
}
