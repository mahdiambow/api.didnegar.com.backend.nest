import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MENU_CATEGORY_EXAMPLE,
  MENU_PARENT_CATEGORY_EXAMPLE,
  MENU_SUB_CATEGORY_EXAMPLE,
} from './category.examples.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

/** سطح ۳ — sub-category */
export class MenuSubCategoryDto {
  @ApiProperty({ example: MENU_SUB_CATEGORY_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: MENU_SUB_CATEGORY_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: MENU_SUB_CATEGORY_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: MENU_SUB_CATEGORY_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: MENU_SUB_CATEGORY_EXAMPLE.icon,
    nullable: true,
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: MENU_SUB_CATEGORY_EXAMPLE.image,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({ example: MENU_SUB_CATEGORY_EXAMPLE.sort })
  sort: number;
}

/** سطح ۲ — category + subCategories */
export class MenuCategoryDto {
  @ApiProperty({ example: MENU_CATEGORY_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: MENU_CATEGORY_EXAMPLE.parentCategoryId })
  parentCategoryId: string;

  @ApiProperty({ example: MENU_CATEGORY_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: MENU_CATEGORY_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: MENU_CATEGORY_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: MENU_CATEGORY_EXAMPLE.icon,
    nullable: true,
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: MENU_CATEGORY_EXAMPLE.image,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({ example: MENU_CATEGORY_EXAMPLE.sort })
  sort: number;

  @ApiProperty({
    type: [MenuSubCategoryDto],
    description: 'سطح ۳ — sub-categories',
    example: MENU_CATEGORY_EXAMPLE.subCategories,
  })
  subCategories: MenuSubCategoryDto[];
}

/** سطح ۱ — parent category + categories */
export class MenuParentCategoryDto {
  @ApiProperty({ example: MENU_PARENT_CATEGORY_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: MENU_PARENT_CATEGORY_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: MENU_PARENT_CATEGORY_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: MENU_PARENT_CATEGORY_EXAMPLE.slug })
  slug: string;

  @ApiPropertyOptional({
    example: MENU_PARENT_CATEGORY_EXAMPLE.icon,
    nullable: true,
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: MENU_PARENT_CATEGORY_EXAMPLE.image,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({ example: MENU_PARENT_CATEGORY_EXAMPLE.sort })
  sort: number;

  @ApiProperty({
    type: [MenuCategoryDto],
    description: 'سطح ۲ — categories',
    example: MENU_PARENT_CATEGORY_EXAMPLE.categories,
  })
  categories: MenuCategoryDto[];
}

/** Query منوی ادمین — pagination روی parent categories */
export class ListMenuQueryDto extends PaginationQueryDto {}
