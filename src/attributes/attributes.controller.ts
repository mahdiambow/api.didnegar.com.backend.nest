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
import { AttributesService } from './attributes.service.js';
import {
  CreateVariantDto,
  CreateVariantValueDto,
  CreateVariantValueForVariantDto,
  ListVariantValuesQueryDto,
  UpdateVariantDto,
  UpdateVariantValueDto,
  VariantResponseDto,
  VariantValueResponseDto,
} from './dto/attribute-response.dto.js';

const VariantApiResponseDto = createSuccessResponseDto(VariantResponseDto, {
  code: 'VARIANT_FOUND',
  message: 'Variant retrieved successfully',
  name: 'Variant',
});

const VariantValueApiResponseDto = createSuccessResponseDto(
  VariantValueResponseDto,
  {
    code: 'VARIANT_VALUE_FOUND',
    message: 'Variant value retrieved successfully',
    name: 'VariantValue',
  },
);

const VariantValuesPaginatedApiResponseDto = createPaginatedResponseDto(
  VariantValueResponseDto,
  {
    code: 'VARIANT_VALUES_FOUND',
    message: 'Variant values retrieved successfully',
    name: 'VariantValues',
  },
);

@ApiTags('Variants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('variants')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'VARIANTS_FOUND',
    message: 'Variants retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست واریانت‌ها' })
  findAllAttributes() {
    return this.attributesService.findAllAttributes();
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'VARIANT_FOUND',
    message: 'Variant retrieved successfully',
  })
  @ApiOkResponse({ type: VariantApiResponseDto })
  @ApiOperation({ summary: 'دریافت واریانت همراه values' })
  findAttribute(@Param('id') id: string) {
    return this.attributesService.findAttribute(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'VARIANT_CREATED',
    message: 'Variant created successfully',
  })
  @ApiOkResponse({ type: VariantApiResponseDto })
  @ApiOperation({
    summary: 'ایجاد واریانت',
    description:
      'variantValueIds اختیاری — valueهای از قبل ساخته‌شده را وصل می‌کند',
  })
  createAttribute(@Body() dto: CreateVariantDto) {
    return this.attributesService.createAttribute(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'VARIANT_UPDATED',
    message: 'Variant updated successfully',
  })
  @ApiOkResponse({ type: VariantApiResponseDto })
  @ApiOperation({ summary: 'ویرایش واریانت' })
  updateAttribute(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.attributesService.updateAttribute(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'VARIANT_DELETED',
    message: 'Variant deleted successfully',
  })
  @ApiOperation({ summary: 'حذف واریانت' })
  removeAttribute(@Param('id') id: string) {
    return this.attributesService.removeAttribute(id);
  }

  @Get(':variantId/values')
  @ApiResponseMeta({
    code: 'VARIANT_VALUES_FOUND',
    message: 'Variant values retrieved successfully',
  })
  @ApiOperation({ summary: 'مقادیر یک واریانت' })
  findValuesByAttribute(@Param('variantId') variantId: string) {
    return this.attributesService.findValuesByAttribute(variantId);
  }

  @Post(':variantId/values')
  @ApiResponseMeta({
    code: 'VARIANT_VALUE_CREATED',
    message: 'Variant value created successfully',
  })
  @ApiOkResponse({ type: VariantValueApiResponseDto })
  @ApiOperation({
    summary: 'ایجاد مقدار برای واریانت',
    description: 'variantId از URL گرفته می‌شود',
  })
  createValueForAttribute(
    @Param('variantId') variantId: string,
    @Body() dto: CreateVariantValueForVariantDto,
  ) {
    return this.attributesService.createValueForAttribute(variantId, dto);
  }
}

@ApiTags('Variant Values')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('variant-values')
export class AttributeValuesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'VARIANT_VALUES_FOUND',
    message: 'Variant values retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست مقادیر واریانت' })
  @ApiOkResponse({ type: VariantValuesPaginatedApiResponseDto })
  findAll(@Query() query: ListVariantValuesQueryDto) {
    return this.attributesService.findAttributeValues(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: VariantValueApiResponseDto })
  @ApiResponseMeta({
    code: 'VARIANT_VALUE_FOUND',
    message: 'Variant value retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت مقدار واریانت' })
  findOne(@Param('id') id: string) {
    return this.attributesService.findAttributeValue(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'VARIANT_VALUE_CREATED',
    message: 'Variant value created successfully',
  })
  @ApiOkResponse({ type: VariantValueApiResponseDto })
  @ApiOperation({
    summary: 'ایجاد مقدار واریانت',
    description: 'فقط value و slug — بدون variantId',
  })
  create(@Body() dto: CreateVariantValueDto) {
    return this.attributesService.createAttributeValue(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'VARIANT_VALUE_UPDATED',
    message: 'Variant value updated successfully',
  })
  @ApiOkResponse({ type: VariantValueApiResponseDto })
  @ApiOperation({ summary: 'ویرایش مقدار واریانت' })
  update(@Param('id') id: string, @Body() dto: UpdateVariantValueDto) {
    return this.attributesService.updateAttributeValue(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'VARIANT_VALUE_DELETED',
    message: 'Variant value deleted successfully',
  })
  @ApiOperation({ summary: 'حذف مقدار واریانت' })
  remove(@Param('id') id: string) {
    return this.attributesService.removeAttributeValue(id);
  }
}
