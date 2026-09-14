import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 300;
export const MAX_LIMIT = 300;

function toPositiveInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Query params مشترک لیست‌ها — اگر نفرستند: page=1, limit=300 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    default: DEFAULT_PAGE,
    example: DEFAULT_PAGE,
    description: 'شماره صفحه (پیش‌فرض ۱)',
  })
  @IsOptional()
  @Transform(({ value }) => toPositiveInt(value, DEFAULT_PAGE))
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: DEFAULT_LIMIT,
    example: DEFAULT_LIMIT,
    maximum: MAX_LIMIT,
    description: 'تعداد در هر صفحه (پیش‌فرض و حداکثر ۳۰۰)',
  })
  @IsOptional()
  @Transform(({ value }) => toPositiveInt(value, DEFAULT_LIMIT))
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit: number = DEFAULT_LIMIT;
}
