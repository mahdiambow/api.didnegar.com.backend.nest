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
import { ProductVariantsService } from './product-variants.service.js';
import {
  AssignVariantAttributeDto,
  CreateProductVariantDto,
  ListProductVariantsQueryDto,
  ProductVariantAttributeResponseDto,
  ProductVariantResponseDto,
  UpdateProductVariantDto,
} from './dto/product-variant-response.dto.js';

const ProductVariantApiResponseDto = createSuccessResponseDto(
  ProductVariantResponseDto,
  {
    code: 'PRODUCT_VARIANT_FOUND',
    message: 'Product variant retrieved successfully',
    name: 'ProductVariant',
  },
);

const ProductVariantsPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductVariantResponseDto,
  {
    code: 'PRODUCT_VARIANTS_FOUND',
    message: 'Product variants retrieved successfully',
    name: 'ProductVariants',
  },
);

const VariantAttributeApiResponseDto = createSuccessResponseDto(
  ProductVariantAttributeResponseDto,
  {
    code: 'VARIANT_ATTRIBUTE_FOUND',
    message: 'Variant attribute link retrieved successfully',
    name: 'VariantAttribute',
  },
);

@ApiTags('Product Variants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('product-variants')
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANTS_FOUND',
    message: 'Product variants retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست واریانت‌های محصول' })
  @ApiOkResponse({ type: ProductVariantsPaginatedApiResponseDto })
  findAll(@Query() query: ListProductVariantsQueryDto) {
    return this.productVariantsService.findAll(query);
  }

  @Get('by-product/:productId')
  @ApiOperation({ summary: 'واریانت‌های یک محصول' })
  findByProduct(@Param('productId') productId: string) {
    return this.productVariantsService.findByProductId(productId);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_FOUND',
    message: 'Product variant retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت واریانت' })
  @ApiOkResponse({ type: ProductVariantApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_CREATED',
    message: 'Product variant created successfully',
  })
  @ApiOperation({ summary: 'ایجاد واریانت' })
  @ApiOkResponse({ type: ProductVariantApiResponseDto })
  create(@Body() dto: CreateProductVariantDto) {
    return this.productVariantsService.create(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_UPDATED',
    message: 'Product variant updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش واریانت' })
  @ApiOkResponse({ type: ProductVariantApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    return this.productVariantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_VARIANT_DELETED',
    message: 'Product variant deleted successfully',
  })
  @ApiOperation({ summary: 'حذف واریانت' })
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(id);
  }

  @Post(':id/attributes')
  @ApiResponseMeta({
    code: 'VARIANT_ATTRIBUTE_CREATED',
    message: 'Variant attribute link created successfully',
  })
  @ApiOperation({ summary: 'اختصاص ویژگی به واریانت' })
  @ApiOkResponse({ type: VariantAttributeApiResponseDto })
  assignAttribute(
    @Param('id') id: string,
    @Body() dto: AssignVariantAttributeDto,
  ) {
    return this.productVariantsService.assignAttribute(id, dto);
  }

  @Delete('attributes/:id')
  @ApiResponseMeta({
    code: 'VARIANT_ATTRIBUTE_DELETED',
    message: 'Variant attribute link deleted successfully',
  })
  @ApiOperation({ summary: 'حذف ویژگی از واریانت' })
  removeAttribute(@Param('id') id: string) {
    return this.productVariantsService.removeAttribute(id);
  }
}
