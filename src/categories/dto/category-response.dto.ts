import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '../entities/category.entity.js';
import { SubCategory } from '../entities/sub-category.entity.js';
import { ProductCategory } from '../entities/product-category.entity.js';
import {
  CATEGORY_EXAMPLES,
  CATEGORY_RESPONSE_EXAMPLE,
  PRODUCT_CATEGORY_RESPONSE_EXAMPLE,
  SUB_CATEGORY_RESPONSE_EXAMPLE,
} from './category.examples.js';
import {
  ProductCategoryLinkDto,
} from './product-category-link.dto.js';

export class CreateProductCategoryDto extends ProductCategoryLinkDto {
  @ApiProperty({
    example: CATEGORY_EXAMPLES.productId,
    description: 'شناسه محصول',
  })
  @IsUUID()
  productId: string;
}

export class UpdateProductCategoryDto extends PartialType(
  ProductCategoryLinkDto,
) {}

export class ListProductCategoriesQueryDto {
  @ApiPropertyOptional({ example: CATEGORY_EXAMPLES.productId })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: CATEGORY_EXAMPLES.categoryId })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: CATEGORY_EXAMPLES.subCategoryId })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class CategoryResponseDto {
  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;
}

export class SubCategoryResponseDto {
  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.categoryId })
  categoryId: string;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;

  @ApiPropertyOptional({
    type: CategoryResponseDto,
    example: CATEGORY_RESPONSE_EXAMPLE,
  })
  category?: CategoryResponseDto;
}

export class ProductCategoryResponseDto {
  @ApiProperty({ example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.productId })
  productId: string;

  @ApiPropertyOptional({
    example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.categoryId,
    nullable: true,
  })
  categoryId: string | null;

  @ApiPropertyOptional({
    example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.subCategoryId,
    nullable: true,
  })
  subCategoryId: string | null;

  @ApiProperty({ example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.isPrimary })
  isPrimary: boolean;

  @ApiProperty({ example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.position })
  position: number;

  @ApiPropertyOptional({
    type: CategoryResponseDto,
    example: CATEGORY_RESPONSE_EXAMPLE,
    nullable: true,
  })
  category?: CategoryResponseDto | null;

  @ApiPropertyOptional({
    type: SubCategoryResponseDto,
    example: SUB_CATEGORY_RESPONSE_EXAMPLE,
    nullable: true,
  })
  subCategory?: SubCategoryResponseDto | null;

  @ApiProperty({ example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;

  @ApiProperty({ example: PRODUCT_CATEGORY_RESPONSE_EXAMPLE.updatedAt })
  updatedAt: Date;
}

export function toCategoryResponse(category: Category): CategoryResponseDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
  };
}

export function toSubCategoryResponse(
  subCategory: SubCategory,
  includeCategory = false,
): SubCategoryResponseDto {
  return {
    id: subCategory.id,
    categoryId: subCategory.categoryId,
    name: subCategory.name,
    slug: subCategory.slug,
    createdAt: subCategory.createdAt,
    category:
      includeCategory && subCategory.category
        ? toCategoryResponse(subCategory.category)
        : undefined,
  };
}

export function toProductCategoryResponse(
  link: ProductCategory,
): ProductCategoryResponseDto {
  const category =
    link.category ??
    (link.subCategory?.category ? link.subCategory.category : null);

  return {
    id: link.id,
    productId: link.productId,
    categoryId: link.categoryId ?? link.subCategory?.categoryId ?? null,
    subCategoryId: link.subCategoryId,
    isPrimary: link.isPrimary,
    position: link.position,
    category: category ? toCategoryResponse(category) : null,
    subCategory: link.subCategory
      ? toSubCategoryResponse(link.subCategory, true)
      : null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}
