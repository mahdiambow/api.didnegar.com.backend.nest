import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CategoriesService } from './categories.service.js';
import {
  CreateParentCategoryDto,
  UpdateParentCategoryDto,
} from './dto/create-parent-category.dto.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto.js';
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
} from './dto/create-sub-category.dto.js';
import {
  ParentCategoryResponseDto,
  CategoryResponseDto,
  SubCategoryResponseDto,
  ProductCategoryResponseDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  ListProductCategoriesQueryDto,
  ListCategoriesQueryDto,
  ListSubCategoriesQueryDto,
} from './dto/category-response.dto.js';

const ParentCategoryApiResponseDto = createSuccessResponseDto(
  ParentCategoryResponseDto,
  {
    code: 'PARENT_CATEGORY_FOUND',
    message: 'Parent category retrieved successfully',
    name: 'ParentCategory',
  },
);

const CategoryApiResponseDto = createSuccessResponseDto(CategoryResponseDto, {
  code: 'CATEGORY_FOUND',
  message: 'Category retrieved successfully',
  name: 'Category',
});

const SubCategoryApiResponseDto = createSuccessResponseDto(
  SubCategoryResponseDto,
  {
    code: 'SUB_CATEGORY_FOUND',
    message: 'Sub category retrieved successfully',
    name: 'SubCategory',
  },
);

const ProductCategoryApiResponseDto = createSuccessResponseDto(
  ProductCategoryResponseDto,
  {
    code: 'PRODUCT_CATEGORY_FOUND',
    message: 'Product category link retrieved successfully',
    name: 'ProductCategory',
  },
);

const ProductCategoriesPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductCategoryResponseDto,
  {
    code: 'PRODUCT_CATEGORIES_FOUND',
    message: 'Product categories retrieved successfully',
    name: 'ProductCategories',
  },
);

@ApiTags('Parent Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('parent-categories')
export class ParentCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'PARENT_CATEGORIES_FOUND',
    message: 'Parent categories retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست parent category ها (سطح ۱)' })
  findAll() {
    return this.categoriesService.findAllParentCategories();
  }

  @Get(':parentCategoryId/categories')
  @ApiOperation({ summary: 'لیست دسته‌های یک parent category' })
  findCategories(@Param('parentCategoryId') parentCategoryId: string) {
    return this.categoriesService.findAllCategories(parentCategoryId);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_FOUND',
    message: 'Parent category retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت parent category' })
  @ApiOkResponse({ type: ParentCategoryApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findParentCategory(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_CREATED',
    message: 'Parent category created successfully',
  })
  @ApiOperation({ summary: 'ایجاد parent category' })
  @ApiOkResponse({ type: ParentCategoryApiResponseDto })
  create(@Body() dto: CreateParentCategoryDto) {
    return this.categoriesService.createParentCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_UPDATED',
    message: 'Parent category updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش parent category' })
  @ApiOkResponse({ type: ParentCategoryApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateParentCategoryDto) {
    return this.categoriesService.updateParentCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_DELETED',
    message: 'Parent category deleted successfully',
  })
  @ApiOperation({ summary: 'حذف parent category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.removeParentCategory(id);
  }
}

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'CATEGORIES_FOUND',
    message: 'Categories retrieved successfully',
  })
  @ApiOperation({
    summary: 'لیست دسته‌بندی‌ها (سطح ۲)',
    description: 'اختیاری: ?parentCategoryId=...',
  })
  findAllCategories(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.findAllCategories(query.parentCategoryId);
  }

  @Get(':categoryId/sub-categories')
  @ApiOperation({ summary: 'لیست زیردسته‌های یک دسته (سطح ۳)' })
  findSubCategories(@Param('categoryId') categoryId: string) {
    return this.categoriesService.findSubCategoriesByCategory(categoryId);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'CATEGORY_FOUND',
    message: 'Category retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت دسته‌بندی' })
  @ApiOkResponse({ type: CategoryApiResponseDto })
  findCategory(@Param('id') id: string) {
    return this.categoriesService.findCategory(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'CATEGORY_CREATED',
    message: 'Category created successfully',
  })
  @ApiOperation({ summary: 'ایجاد دسته‌بندی — نیاز به parentCategoryId' })
  @ApiOkResponse({ type: CategoryApiResponseDto })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'CATEGORY_UPDATED',
    message: 'Category updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش دسته‌بندی' })
  @ApiOkResponse({ type: CategoryApiResponseDto })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'CATEGORY_DELETED',
    message: 'Category deleted successfully',
  })
  @ApiOperation({ summary: 'حذف دسته‌بندی' })
  removeCategory(@Param('id') id: string) {
    return this.categoriesService.removeCategory(id);
  }
}

@ApiTags('Sub Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'SUB_CATEGORIES_FOUND',
    message: 'Sub categories retrieved successfully',
  })
  @ApiOperation({
    summary: 'لیست زیردسته‌ها (با category و parentCategory)',
    description: 'فیلتر اختیاری: ?categoryId=... یا ?parentCategoryId=...',
  })
  findAll(@Query() query: ListSubCategoriesQueryDto) {
    return this.categoriesService.findSubCategories(query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_FOUND',
    message: 'Sub category retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت زیردسته با دیتای populate شده' })
  @ApiOkResponse({ type: SubCategoryApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findSubCategory(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_CREATED',
    message: 'Sub category created successfully',
  })
  @ApiOperation({ summary: 'ایجاد زیردسته (سطح ۳)' })
  @ApiOkResponse({ type: SubCategoryApiResponseDto })
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.categoriesService.createSubCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_UPDATED',
    message: 'Sub category updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش زیردسته' })
  @ApiOkResponse({ type: SubCategoryApiResponseDto })
  updateSubCategory(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
    return this.categoriesService.updateSubCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_DELETED',
    message: 'Sub category deleted successfully',
  })
  @ApiOperation({ summary: 'حذف زیردسته' })
  removeSubCategory(@Param('id') id: string) {
    return this.categoriesService.removeSubCategory(id);
  }
}

@ApiTags('Product Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCT_CATEGORIES_FOUND',
    message: 'Product categories retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست ارتباط محصول-دسته' })
  @ApiOkResponse({ type: ProductCategoriesPaginatedApiResponseDto })
  findProductCategories(@Query() query: ListProductCategoriesQueryDto) {
    return this.categoriesService.findProductCategories(query);
  }

  @Get('by-product/:productId')
  @ApiOperation({ summary: 'دسته‌بندی‌های یک محصول' })
  findByProduct(@Param('productId') productId: string) {
    return this.categoriesService.getProductCategoriesByProductId(productId);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_CATEGORY_CREATED',
    message: 'Product category link created successfully',
  })
  @ApiOperation({ summary: 'اختصاص دسته به محصول' })
  @ApiOkResponse({ type: ProductCategoryApiResponseDto })
  assignProductCategory(@Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.assignProductCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_CATEGORY_UPDATED',
    message: 'Product category link updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش ارتباط محصول-دسته' })
  @ApiOkResponse({ type: ProductCategoryApiResponseDto })
  updateProductCategory(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.categoriesService.updateProductCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_CATEGORY_DELETED',
    message: 'Product category link deleted successfully',
  })
  @ApiOperation({ summary: 'حذف ارتباط محصول-دسته' })
  removeProductCategory(@Param('id') id: string) {
    return this.categoriesService.removeProductCategory(id);
  }
}
