import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CATEGORY_RESPONSE_EXAMPLE,
  PARENT_CATEGORY_RESPONSE_EXAMPLE,
  SUB_CATEGORY_RESPONSE_EXAMPLE,
} from './category.examples.js';

/** نود برگ منو — sub-category */
export class MenuSubCategoryDto {
  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: SUB_CATEGORY_RESPONSE_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: SUB_CATEGORY_RESPONSE_EXAMPLE.icon,
    nullable: true,
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: SUB_CATEGORY_RESPONSE_EXAMPLE.image,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({ example: 0 })
  sort: number;
}

/** نود میانی منو — category + children */
export class MenuCategoryDto {
  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: CATEGORY_RESPONSE_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: CATEGORY_RESPONSE_EXAMPLE.icon,
    nullable: true,
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: CATEGORY_RESPONSE_EXAMPLE.image,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({ example: 0 })
  sort: number;

  @ApiProperty({ type: [MenuSubCategoryDto] })
  children: MenuSubCategoryDto[];
}

/** نود ریشه منو — parent category + children */
export class MenuParentCategoryDto {
  @ApiProperty({ example: PARENT_CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: PARENT_CATEGORY_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: PARENT_CATEGORY_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE.icon,
    nullable: true,
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE.image,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({ example: 0 })
  sort: number;

  @ApiProperty({ type: [MenuCategoryDto] })
  children: MenuCategoryDto[];
}
