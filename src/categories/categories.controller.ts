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
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
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
  ListParentCategoriesQueryDto,
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

const ParentCategoriesListApiResponseDto = createSuccessResponseDto(
  ParentCategoryResponseDto,
  {
    code: 'PARENT_CATEGORIES_FOUND',
    message: 'Parent categories retrieved successfully',
    name: 'ParentCategoriesList',
  },
);

const CategoryApiResponseDto = createSuccessResponseDto(CategoryResponseDto, {
  code: 'CATEGORY_FOUND',
  message: 'Category retrieved successfully',
  name: 'Category',
});

const CategoriesListApiResponseDto = createSuccessResponseDto(
  CategoryResponseDto,
  {
    code: 'CATEGORIES_FOUND',
    message: 'Categories retrieved successfully',
    name: 'CategoriesList',
  },
);

const SubCategoryApiResponseDto = createSuccessResponseDto(
  SubCategoryResponseDto,
  {
    code: 'SUB_CATEGORY_FOUND',
    message: 'Sub category retrieved successfully',
    name: 'SubCategory',
  },
);

const SubCategoriesListApiResponseDto = createSuccessResponseDto(
  SubCategoryResponseDto,
  {
    code: 'SUB_CATEGORIES_FOUND',
    message: 'Sub categories retrieved successfully',
    name: 'SubCategoriesList',
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
  @ApiOperation({ summary: 'List parent categories (level 1)', description: 'لیست parent category ها (سطح ۱)' })
  @ApiOkResponse({ type: ParentCategoriesListApiResponseDto })
  findAll(@Query() query: ListParentCategoriesQueryDto) {
    return this.categoriesService.findAllParentCategories(query);
  }

  @Get(':parentCategoryId/categories')
  @ApiResponseMeta({
    code: 'CATEGORIES_FOUND',
    message: 'Categories retrieved successfully',
  })
  @ApiOperation({ summary: 'List categories of a parent category', description: 'لیست دسته‌های یک parent category' })
  @ApiOkResponse({ type: CategoriesListApiResponseDto })
  findCategories(
    @Param('parentCategoryId') parentCategoryId: string,
    @Query() query: ListCategoriesQueryDto,
  ) {
    return this.categoriesService.findAllCategories({
      ...query,
      parentCategoryId,
    });
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_FOUND',
    message: 'Parent category retrieved successfully',
  })
  @ApiOperation({ summary: 'Get parent category', description: 'دریافت parent category' })
  @ApiOkResponse({ type: ParentCategoryApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findParentCategory(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_CREATED',
    message: 'Parent category created successfully',
  })
  @ApiOperation({ summary: 'Create parent category', description: 'ایجاد parent category' })
  @ApiOkResponse({ type: ParentCategoryApiResponseDto })
  create(@Body() dto: CreateParentCategoryDto) {
    return this.categoriesService.createParentCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_UPDATED',
    message: 'Parent category updated successfully',
  })
  @ApiOperation({ summary: 'Update parent category', description: 'ویرایش parent category' })
  @ApiOkResponse({ type: ParentCategoryApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateParentCategoryDto) {
    return this.categoriesService.updateParentCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PARENT_CATEGORY_DELETED',
    message: 'Parent category deleted successfully',
  })
  @ApiOperation({ summary: 'Delete parent category', description: 'حذف parent category' })
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
    summary: 'List categories (level 2)',
    description: 'لیست دسته‌بندی‌ها (سطح ۲)\n\nاختیاری: ?parentCategoryId=&search=&isActive=',
  })
  @ApiOkResponse({ type: CategoriesListApiResponseDto })
  findAllCategories(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.findAllCategories(query);
  }

  @Get(':categoryId/sub-categories')
  @ApiResponseMeta({
    code: 'SUB_CATEGORIES_FOUND',
    message: 'Sub categories retrieved successfully',
  })
  @ApiOperation({ summary: 'List subcategories of a category (level 3)', description: 'لیست زیردسته‌های یک دسته (سطح ۳)' })
  @ApiOkResponse({ type: SubCategoriesListApiResponseDto })
  findSubCategories(
    @Param('categoryId') categoryId: string,
    @Query() query: ListSubCategoriesQueryDto,
  ) {
    return this.categoriesService.findSubCategoriesByCategory(
      categoryId,
      query,
    );
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'CATEGORY_FOUND',
    message: 'Category retrieved successfully',
  })
  @ApiOperation({ summary: 'Get category', description: 'دریافت دسته‌بندی' })
  @ApiOkResponse({ type: CategoryApiResponseDto })
  findCategory(@Param('id') id: string) {
    return this.categoriesService.findCategory(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'CATEGORY_CREATED',
    message: 'Category created successfully',
  })
  @ApiOperation({ summary: 'Create category — requires parentCategoryId', description: 'ایجاد دسته‌بندی — نیاز به parentCategoryId' })
  @ApiOkResponse({ type: CategoryApiResponseDto })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'CATEGORY_UPDATED',
    message: 'Category updated successfully',
  })
  @ApiOperation({ summary: 'Update category', description: 'ویرایش دسته‌بندی' })
  @ApiOkResponse({ type: CategoryApiResponseDto })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'CATEGORY_DELETED',
    message: 'Category deleted successfully',
  })
  @ApiOperation({ summary: 'Delete category', description: 'حذف دسته‌بندی' })
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
    summary: 'List subcategories (with category and parentCategory)',
    description: 'لیست زیردسته‌ها (با category و parentCategory)\n\nفیلتر اختیاری: ?categoryId= یا ?parentCategoryId= یا ?search=',
  })
  @ApiOkResponse({ type: SubCategoriesListApiResponseDto })
  findAll(@Query() query: ListSubCategoriesQueryDto) {
    return this.categoriesService.findSubCategories(query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_FOUND',
    message: 'Sub category retrieved successfully',
  })
  @ApiOperation({ summary: 'Get subcategory with populated data', description: 'دریافت زیردسته با دیتای populate شده' })
  @ApiOkResponse({ type: SubCategoryApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findSubCategory(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_CREATED',
    message: 'Sub category created successfully',
  })
  @ApiOperation({ summary: 'Create subcategory (level 3)', description: 'ایجاد زیردسته (سطح ۳)' })
  @ApiOkResponse({ type: SubCategoryApiResponseDto })
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.categoriesService.createSubCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_UPDATED',
    message: 'Sub category updated successfully',
  })
  @ApiOperation({ summary: 'Update subcategory', description: 'ویرایش زیردسته' })
  @ApiOkResponse({ type: SubCategoryApiResponseDto })
  updateSubCategory(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
    return this.categoriesService.updateSubCategory(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_DELETED',
    message: 'Sub category deleted successfully',
  })
  @ApiOperation({ summary: 'Delete subcategory', description: 'حذف زیردسته' })
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
  @ApiOperation({ summary: 'List product-category relations', description: 'لیست ارتباط محصول-دسته' })
  @ApiOkResponse({ type: ProductCategoriesPaginatedApiResponseDto })
  findProductCategories(@Query() query: ListProductCategoriesQueryDto) {
    return this.categoriesService.findProductCategories(query);
  }

  @Get('by-product/:productId')
  @ApiOperation({ summary: 'Categories of a product', description: 'دسته‌بندی‌های یک محصول' })
  findByProduct(@Param('productId') productId: string) {
    return this.categoriesService.getProductCategoriesByProductId(productId);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_CATEGORY_CREATED',
    message: 'Product category link created successfully',
  })
  @ApiOperation({ summary: 'Assign category to product', description: 'اختصاص دسته به محصول' })
  @ApiOkResponse({ type: ProductCategoryApiResponseDto })
  assignProductCategory(@Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.assignProductCategory(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_CATEGORY_UPDATED',
    message: 'Product category link updated successfully',
  })
  @ApiOperation({ summary: 'Update product-category relation', description: 'ویرایش ارتباط محصول-دسته' })
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
  @ApiOperation({ summary: 'Delete product-category relation', description: 'حذف ارتباط محصول-دسته' })
  removeProductCategory(@Param('id') id: string) {
    return this.categoriesService.removeProductCategory(id);
  }
}
