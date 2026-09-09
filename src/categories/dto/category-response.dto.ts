import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '../entities/category.entity.js';
import { ParentCategory } from '../entities/parent-category.entity.js';
import { SubCategory } from '../entities/sub-category.entity.js';
import { ProductCategory } from '../entities/product-category.entity.js';
import {
  CATEGORY_EXAMPLES,
  CATEGORY_RESPONSE_EXAMPLE,
  PARENT_CATEGORY_RESPONSE_EXAMPLE,
  PRODUCT_CATEGORY_RESPONSE_EXAMPLE,
  SUB_CATEGORY_RESPONSE_EXAMPLE,
} from './category.examples.js';
import { ProductCategoryLinkDto } from './product-category-link.dto.js';

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

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'فیلتر بر اساس parent category',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;
}

export class ListSubCategoriesQueryDto {
  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر بر اساس category',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'فیلتر بر اساس parent category',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;
}

export class ParentCategoryResponseDto {
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

  @ApiProperty({ example: 0 })
  sort: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: PARENT_CATEGORY_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;
}

export class CategoryResponseDto {
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

  @ApiProperty({ example: 0 })
  sort: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: CATEGORY_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;

  @ApiPropertyOptional({
    type: ParentCategoryResponseDto,
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE,
  })
  parentCategory?: ParentCategoryResponseDto;
}

export class SubCategoryResponseDto {
  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.id })
  id: string;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.categoryId })
  categoryId: string;

  @ApiProperty({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'شناسه parent category',
  })
  parentCategoryId: string | null;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.name })
  name: string;

  @ApiPropertyOptional({
    example: SUB_CATEGORY_RESPONSE_EXAMPLE.nameEn,
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.slug })
  slug: string;

  @ApiProperty({ example: 0 })
  sort: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: SUB_CATEGORY_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;

  @ApiPropertyOptional({
    type: ParentCategoryResponseDto,
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE,
    description: 'parent category populate شده',
  })
  parentCategory?: ParentCategoryResponseDto | null;

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

export function toParentCategoryResponse(
  parent: ParentCategory,
): ParentCategoryResponseDto {
  return {
    id: parent.id,
    name: parent.name,
    nameEn: parent.nameEn ?? null,
    slug: parent.slug,
    sort: parent.sort ?? 0,
    isActive: parent.isActive ?? true,
    createdAt: parent.createdAt,
  };
}

export function toCategoryResponse(
  category: Category,
  includeParent = true,
): CategoryResponseDto {
  return {
    id: category.id,
    parentCategoryId: category.parentCategoryId,
    name: category.name,
    nameEn: category.nameEn ?? null,
    slug: category.slug,
    sort: category.sort ?? 0,
    isActive: category.isActive ?? true,
    createdAt: category.createdAt,
    parentCategory: category.parentCategory
      ? toParentCategoryResponse(category.parentCategory)
      : undefined,
  };
}

export function toSubCategoryResponse(
  subCategory: SubCategory,
  includeCategory = true,
): SubCategoryResponseDto {
  const parentCategory =
    subCategory.category?.parentCategory ?? undefined;
  const parentCategoryId =
    subCategory.category?.parentCategoryId ??
    parentCategory?.id ??
    null;

  return {
    id: subCategory.id,
    categoryId: subCategory.categoryId,
    parentCategoryId,
    name: subCategory.name,
    nameEn: subCategory.nameEn ?? null,
    slug: subCategory.slug,
    sort: subCategory.sort ?? 0,
    isActive: subCategory.isActive ?? true,
    createdAt: subCategory.createdAt,
    parentCategory: parentCategory
      ? toParentCategoryResponse(parentCategory)
      : null,
    category:
      includeCategory && subCategory.category
        ? toCategoryResponse(subCategory.category, true)
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
    category: category ? toCategoryResponse(category, true) : null,
    subCategory: link.subCategory
      ? toSubCategoryResponse(link.subCategory, true)
      : null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}
