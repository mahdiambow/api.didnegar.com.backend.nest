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
import { ProductVariantsService } from './product-variants.service.js';
import {
  CreateProductAttributeDto,
  ListProductAttributesQueryDto,
  ProductAttributeResponseDto,
  UpdateProductAttributeDto,
} from './dto/product-variant-response.dto.js';

const ProductAttributeApiResponseDto = createSuccessResponseDto(
  ProductAttributeResponseDto,
  {
    code: 'PRODUCT_VARIANT_FOUND',
    message: 'Product تنوع retrieved successfully',
    name: 'ProductAttribute',
  },
);

const ProductAttributesPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductAttributeResponseDto,
  {
    code: 'PRODUCT_VARIANTS_FOUND',
    message: 'Product تنوعs retrieved successfully',
    name: 'ProductAttributes',
  },
);

@ApiTags('Product Variants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANTS_FOUND',
    message: 'Product تنوعs retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست تنوعهای محصول' })
  @ApiOkResponse({ type: ProductAttributesPaginatedApiResponseDto })
  findAll(@Query() query: ListProductAttributesQueryDto) {
    return this.productVariantsService.findAll(query);
  }

  @Get('by-product/:productId')
  @ApiOperation({ summary: 'تنوعهای یک محصول' })
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productVariantsService.findByProductId(productId);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_FOUND',
    message: 'Product تنوع retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت تنوع محصول' })
  @ApiOkResponse({ type: ProductAttributeApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Post()
  @UseGuards(RoleGuard)
  @RequireRole('admin', 'super-admin')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_CREATED',
    message: 'Product تنوع created successfully',
  })
  @ApiOperation({
    summary: 'ایجاد تنوع محصول',
    description: 'productId اجباری — id در response برمی‌گردد',
  })
  @ApiOkResponse({ type: ProductAttributeApiResponseDto })
  create(@Body() dto: CreateProductAttributeDto) {
    return this.productVariantsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @RequireRole('admin', 'super-admin')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_UPDATED',
    message: 'Product تنوع updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش تنوع محصول' })
  @ApiOkResponse({ type: ProductAttributeApiResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductAttributeDto,
  ) {
    return this.productVariantsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @RequireRole('admin', 'super-admin')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_DELETED',
    message: 'Product تنوع deleted successfully',
  })
  @ApiOperation({ summary: 'حذف تنوع محصول' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantsService.remove(id);
  }
}
