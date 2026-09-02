import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ProductVariantAttributesService } from './product-variant-attributes.service.js';
import {
  CreateProductAttributeVariantDto,
  ListProductAttributeVariantsQueryDto,
  ProductAttributeVariantResponseDto,
} from './dto/product-variant-response.dto.js';

const ProductAttributeVariantApiResponseDto = createSuccessResponseDto(
  ProductAttributeVariantResponseDto,
  {
    code: 'PRODUCT_ATTRIBUTE_VARIANT_FOUND',
    message: 'Product attribute variant link retrieved successfully',
    name: 'ProductAttributeVariant',
  },
);

const ProductAttributeVariantsPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductAttributeVariantResponseDto,
  {
    code: 'PRODUCT_ATTRIBUTE_VARIANTS_FOUND',
    message: 'Product attribute variants retrieved successfully',
    name: 'ProductAttributeVariants',
  },
);

@ApiTags('Product Attribute Variants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('product-attribute-variants')
export class ProductVariantAttributesController {
  constructor(
    private readonly productVariantAttributesService: ProductVariantAttributesService,
  ) {}

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_VARIANTS_FOUND',
    message: 'Product attribute variants retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست ارتباط attribute-واریانت' })
  @ApiOkResponse({ type: ProductAttributeVariantsPaginatedApiResponseDto })
  findAll(@Query() query: ListProductAttributeVariantsQueryDto) {
    return this.productVariantAttributesService.findAll(query);
  }

  @Get('by-attribute/:attributeId')
  @ApiOperation({ summary: 'واریانت‌های یک attribute محصول' })
  findByAttribute(@Param('attributeId') attributeId: string) {
    return this.productVariantAttributesService.findByAttributeId(attributeId);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_VARIANT_FOUND',
    message: 'Product attribute variant link retrieved successfully',
  })
  @ApiOkResponse({ type: ProductAttributeVariantApiResponseDto })
  @ApiOperation({ summary: 'دریافت یک ارتباط attribute-واریانت' })
  findOne(@Param('id') id: string) {
    return this.productVariantAttributesService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_VARIANT_CREATED',
    message: 'Product attribute variant link created successfully',
  })
  @ApiOkResponse({ type: ProductAttributeVariantApiResponseDto })
  @ApiOperation({
    summary: 'اختصاص variantValue به attribute محصول',
    description: 'جدول product_variant_attributes',
  })
  create(@Body() dto: CreateProductAttributeVariantDto) {
    return this.productVariantAttributesService.create(dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_VARIANT_DELETED',
    message: 'Product attribute variant link deleted successfully',
  })
  @ApiOperation({ summary: 'حذف ارتباط attribute-واریانت' })
  remove(@Param('id') id: string) {
    return this.productVariantAttributesService.remove(id);
  }
}
