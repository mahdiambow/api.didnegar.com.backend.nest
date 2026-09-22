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
    /** نمونه data برای Swagger */
    example?: unknown;
  },
) {
  class SuccessResponseDto {
    @ApiProperty({ example: options.code })
    code: string;

    @ApiProperty({ example: options.message })
    message: string;

    @ApiProperty(
      options.isArray
        ? {
            type: dataDto,
            isArray: true,
            ...(options.example !== undefined
              ? { example: options.example }
              : {}),
          }
        : {
            type: dataDto,
            ...(options.example !== undefined
              ? { example: options.example }
              : {}),
          },
    )
    data: T | T[];
  }

  Object.defineProperty(SuccessResponseDto, 'name', {
    value: `${options.name}SuccessResponseDto`,
  });

  return SuccessResponseDto;
}
