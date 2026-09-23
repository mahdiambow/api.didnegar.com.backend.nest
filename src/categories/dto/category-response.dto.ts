import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
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

function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}

export class CreateProductCategoryDto extends ProductCategoryLinkDto {
  @ApiProperty({
    example: CATEGORY_EXAMPLES.productId,
    description: 'شناسه محصول',
  })
  @IsULID()
  productId: string;
}

export class UpdateProductCategoryDto extends PartialType(
  ProductCategoryLinkDto,
) {}

export class ListProductCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: CATEGORY_EXAMPLES.productId })
  @IsOptional()
  @IsULID()
  productId?: string;

  @ApiPropertyOptional({ example: CATEGORY_EXAMPLES.categoryId })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({ example: CATEGORY_EXAMPLES.subCategoryId })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;
}

export class ListParentCategoriesQueryDto {
  @ApiPropertyOptional({
    example: 'دیجیتال',
    description: 'جستجو در name / nameEn / slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 'کالای دیجیتال' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'digital' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class ListCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'فیلتر بر اساس parent category',
  })
  @IsOptional()
  @IsULID()
  parentCategoryId?: string;

  @ApiPropertyOptional({
    example: 'موبایل',
    description: 'جستجو در name / nameEn / slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 'موبایل' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'mobile' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class ListSubCategoriesQueryDto {
  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر بر اساس category',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.parentCategoryId,
    description: 'فیلتر بر اساس parent category',
  })
  @IsOptional()
  @IsULID()
  parentCategoryId?: string;

  @ApiPropertyOptional({
    example: 'گوشی',
    description: 'جستجو در name / nameEn / slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 'گوشی سامسونگ' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'samsung-phones' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
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

  @ApiPropertyOptional({
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE.icon,
    nullable: true,
    description: 'URL آیکون',
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: PARENT_CATEGORY_RESPONSE_EXAMPLE.image,
    nullable: true,
    description: 'URL تصویر',
  })
  image: string | null;

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

  @ApiPropertyOptional({
    example: CATEGORY_RESPONSE_EXAMPLE.icon,
    nullable: true,
    description: 'URL آیکون',
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: CATEGORY_RESPONSE_EXAMPLE.image,
    nullable: true,
    description: 'URL تصویر',
  })
  image: string | null;

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

  @ApiPropertyOptional({
    example: SUB_CATEGORY_RESPONSE_EXAMPLE.icon,
    nullable: true,
    description: 'URL آیکون',
  })
  icon: string | null;

  @ApiPropertyOptional({
    example: SUB_CATEGORY_RESPONSE_EXAMPLE.image,
    nullable: true,
    description: 'URL تصویر',
  })
  image: string | null;

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
    icon: parent.icon ?? null,
    image: parent.image ?? null,
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
    icon: category.icon ?? null,
    image: category.image ?? null,
    sort: category.sort ?? 0,
    isActive: category.isActive ?? true,
    createdAt: category.createdAt,
    parentCategory:
      includeParent && category.parentCategory
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
    icon: subCategory.icon ?? null,
    image: subCategory.image ?? null,
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
