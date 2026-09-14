import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CATEGORY_RESPONSE_EXAMPLE,
  PARENT_CATEGORY_RESPONSE_EXAMPLE,
  SUB_CATEGORY_RESPONSE_EXAMPLE,
} from './category.examples.js';

/** سطح ۳ — sub-category */
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

/** سطح ۲ — category + subCategories */
export class MenuCategoryDto {
  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.parentCategoryId })
  parentCategoryId: string;

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

  @ApiProperty({
    type: [MenuSubCategoryDto],
    description: 'سطح ۳ — sub-categories',
  })
  subCategories: MenuSubCategoryDto[];
}

/** سطح ۱ — parent category + categories */
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

  @ApiProperty({
    type: [MenuCategoryDto],
    description: 'سطح ۲ — categories',
  })
  categories: MenuCategoryDto[];
}
