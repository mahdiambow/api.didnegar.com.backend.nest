import { ParseULIDPipe } from '../common/id/index.js';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../utils/auth/guards/role.guard.js';
import { RequireRole } from '../utils/auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';
import {
  BrandResponseDto,
  ProductListItemDto,
  ProductPriceResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto.js';
import { AttributeValueResponseDto } from '../attributes/dto/attribute-value.dto.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';

const ProductApiResponseDto = createSuccessResponseDto(ProductResponseDto, {
  code: 'PRODUCT_FOUND',
  message: 'Product retrieved successfully',
  name: 'Product',
});

const ProductsPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductListItemDto,
  {
    code: 'PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
    name: 'Products',
  },
);

const BrandsListApiResponseDto = createSuccessResponseDto(BrandResponseDto, {
  code: 'BRANDS_FOUND',
  message: 'Brands retrieved successfully',
  name: 'BrandsList',
});

@ApiTags('Products')
@ApiExtraModels(
  ProductResponseDto,
  ProductListItemDto,
  ProductPriceResponseDto,
  AttributeValueResponseDto,
)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('brands')
  @ApiResponseMeta({
    code: 'BRANDS_FOUND',
    message: 'Brands retrieved successfully',
  })
  @ApiOperation({ summary: 'List brands', description: 'لیست برندها' })
  @ApiOkResponse({ type: BrandsListApiResponseDto })
  findAllBrands() {
    return this.productsService.findAllBrands();
  }

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
  })
  @ApiOperation({
    summary: 'List products with pagination and filters',
    description: [
      'لیست کاتالوگ محصولات (برای مرور/انتخاب محصول موجود).',
      '',
      'فروشنده برای **محصولات خودش** از `GET /seller-offers/me` استفاده کند.',
      '',
      'نمونه کاتالوگ تأییدشده:',
      '```',
      'GET /products?page=1&limit=20&approvalStatus=approved&status=publish',
      '```',
    ].join('\n'),
  })
  @ApiOkResponse({ type: ProductsPaginatedApiResponseDto })
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_FOUND',
    message: 'Product retrieved successfully',
  })
  @ApiOperation({ summary: 'Get one product', description: 'دریافت یک محصول' })
  @ApiOkResponse({ type: ProductApiResponseDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_CREATED',
    message: 'Product created successfully',
  })
  @ApiOperation({
    summary: 'Create new product',
    description: [
      'ایجاد محصول جدید با `approvalStatus=pending`.',
      '',
      'اگر `sellerIds` ست شود، برای فروشندهٔ اول (`createdBySellerId`) یک **seller-offer pending** هم ساخته می‌شود',
      'تا در `GET /seller-offers/me` دیده شود.',
      '',
      'مسیر پیشنهادی فروشنده برای محصول جدید: `POST /seller-offers` با فیلد `product` (بدون productId).',
    ].join('\n'),
  })
  @ApiOkResponse({ type: ProductApiResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id/approval')
  @UseGuards(RoleGuard)
  @RequireRole(
    DEFAULT_ROLE_SLUGS.SUPER_SELLER,
    DEFAULT_ROLE_SLUGS.ADMIN,
    DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
  )
  @ApiResponseMeta({
    code: 'PRODUCT_REVIEWED',
    message: 'Product approval status updated',
  })
  @ApiOperation({
    summary: 'Approve / reject / set product pending (admin / super-seller)',
    description: 'تأیید / رد / بازگرداندن به انتظار محصول (ادمین / سوپر فروشنده)',
  })
  @ApiOkResponse({ type: ProductApiResponseDto })
  review(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: ReviewProductDto,
  ) {
    return this.productsService.review(id, dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_UPDATED',
    message: 'Product updated successfully',
  })
  @ApiOperation({
    summary: 'Update product',
    description: 'ویرایش محصول\n\nهر تغییر روی محصول وضعیت را به pending برمی‌گرداند تا ادمین دوباره تأیید کند. تغییر قیمت از طریق seller-offers است و فوری اعمال می‌شود.',
  })
  @ApiOkResponse({ type: ProductApiResponseDto })
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_DELETED',
    message: 'Product deleted successfully',
  })
  @ApiOperation({ summary: 'Delete product', description: 'حذف محصول' })
  remove(@Param('id', ParseULIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
