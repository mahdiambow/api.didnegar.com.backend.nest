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
  CreateProductAttributeDto,
  ListProductAttributesQueryDto,
  ProductAttributeResponseDto,
  UpdateProductAttributeDto,
} from './dto/product-variant-response.dto.js';

const ProductAttributeApiResponseDto = createSuccessResponseDto(
  ProductAttributeResponseDto,
  {
    code: 'PRODUCT_ATTRIBUTE_FOUND',
    message: 'Product attribute retrieved successfully',
    name: 'ProductAttribute',
  },
);

const ProductAttributesPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductAttributeResponseDto,
  {
    code: 'PRODUCT_ATTRIBUTES_FOUND',
    message: 'Product attributes retrieved successfully',
    name: 'ProductAttributes',
  },
);

@ApiTags('Product Attributes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('product-attributes')
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @Get()
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTES_FOUND',
    message: 'Product attributes retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست attributeهای محصول' })
  @ApiOkResponse({ type: ProductAttributesPaginatedApiResponseDto })
  findAll(@Query() query: ListProductAttributesQueryDto) {
    return this.productVariantsService.findAll(query);
  }

  @Get('by-product/:productId')
  @ApiOperation({ summary: 'attributeهای یک محصول' })
  findByProduct(@Param('productId') productId: string) {
    return this.productVariantsService.findByProductId(productId);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_FOUND',
    message: 'Product attribute retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت attribute محصول' })
  @ApiOkResponse({ type: ProductAttributeApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_CREATED',
    message: 'Product attribute created successfully',
  })
  @ApiOperation({
    summary: 'ایجاد attribute محصول',
    description: 'productId اجباری — id در response برمی‌گردد',
  })
  @ApiOkResponse({ type: ProductAttributeApiResponseDto })
  create(@Body() dto: CreateProductAttributeDto) {
    return this.productVariantsService.create(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_UPDATED',
    message: 'Product attribute updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش attribute محصول' })
  @ApiOkResponse({ type: ProductAttributeApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProductAttributeDto) {
    return this.productVariantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'PRODUCT_ATTRIBUTE_DELETED',
    message: 'Product attribute deleted successfully',
  })
  @ApiOperation({ summary: 'حذف attribute محصول' })
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(id);
  }
}
