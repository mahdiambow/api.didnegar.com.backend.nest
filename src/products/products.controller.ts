import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { RoleGuard } from '../auth/guards/role.guard.js';
import { RequireRole } from '../auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';
import {
  BrandResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';

const ProductApiResponseDto = createSuccessResponseDto(ProductResponseDto, {
  code: 'PRODUCT_FOUND',
  message: 'Product retrieved successfully',
  name: 'Product',
});

const ProductsPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductResponseDto,
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
  @ApiOperation({ summary: 'لیست برندها' })
  @ApiOkResponse({ type: BrandsListApiResponseDto })
  findAllBrands() {
    return this.productsService.findAllBrands();
  }

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست محصولات با pagination و فیلتر' })
  @ApiOkResponse({ type: ProductsPaginatedApiResponseDto })
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_FOUND',
    message: 'Product retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک محصول' })
  @ApiOkResponse({ type: ProductApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_CREATED',
    message: 'Product created successfully',
  })
  @ApiOperation({
    summary: 'ایجاد محصول جدید',
    description:
      'محصول با approvalStatus=pending ساخته می‌شود تا ادمین تأیید کند',
  })
  @ApiOkResponse({ type: ProductApiResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id/approval')
  @UseGuards(RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiResponseMeta({
    code: 'PRODUCT_REVIEWED',
    message: 'Product approval status updated',
  })
  @ApiOperation({
    summary: 'تأیید / رد / بازگرداندن به انتظار محصول (فقط ادمین)',
  })
  @ApiOkResponse({ type: ProductApiResponseDto })
  review(
    @Param('id', ParseUUIDPipe) id: string,
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
    summary: 'ویرایش محصول',
    description:
      'هر تغییر روی محصول وضعیت را به pending برمی‌گرداند تا ادمین دوباره تأیید کند. تغییر قیمت از طریق seller-offers است و فوری اعمال می‌شود.',
  })
  @ApiOkResponse({ type: ProductApiResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_DELETED',
    message: 'Product deleted successfully',
  })
  @ApiOperation({ summary: 'حذف محصول' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
