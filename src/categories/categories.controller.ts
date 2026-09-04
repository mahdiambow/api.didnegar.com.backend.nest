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
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto.js';
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
} from './dto/create-sub-category.dto.js';
import {
  CategoryResponseDto,
  SubCategoryResponseDto,
  ProductCategoryResponseDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  ListProductCategoriesQueryDto,
} from './dto/category-response.dto.js';

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
  @ApiOperation({ summary: 'لیست دسته‌بندی‌ها' })
  findAllCategories() {
    return this.categoriesService.findAllCategories();
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
  @ApiOperation({ summary: 'ایجاد دسته‌بندی' })
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

  @Get(':categoryId/sub-categories')
  @ApiOperation({ summary: 'لیست زیردسته‌های یک دسته' })
  findSubCategories(@Param('categoryId') categoryId: string) {
    return this.categoriesService.findSubCategoriesByCategory(categoryId);
  }
}

@ApiTags('Sub Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiResponseMeta({
    code: 'SUB_CATEGORY_CREATED',
    message: 'Sub category created successfully',
  })
  @ApiOperation({ summary: 'ایجاد زیردسته' })
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
