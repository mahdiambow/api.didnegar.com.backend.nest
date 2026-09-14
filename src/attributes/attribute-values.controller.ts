import { ParseULIDPipe } from '../common/id/index.js';
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
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { AttributesService } from './attributes.service.js';
import {
  AttributeValueResponseDto,
  CreateAttributeValueDto,
  ListAttributeValuesQueryDto,
  UpdateAttributeValueDto,
} from './dto/attribute-value.dto.js';

const AttributeValueApiResponseDto = createSuccessResponseDto(
  AttributeValueResponseDto,
  {
    code: 'ATTRIBUTE_VALUE_FOUND',
    message: 'Attribute value retrieved successfully',
    name: 'AttributeValue',
  },
);

const AttributeValuesPaginatedApiResponseDto = createPaginatedResponseDto(
  AttributeValueResponseDto,
  {
    code: 'ATTRIBUTE_VALUES_FOUND',
    message: 'Attribute values retrieved successfully',
    name: 'AttributeValues',
  },
);

@ApiTags('Attribute Values')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attribute-values')
export class AttributeValuesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.attributes.read)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_VALUES_FOUND',
    message: 'Attribute values retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست مقادیر ویژگی با pagination و فیلتر' })
  @ApiOkResponse({ type: AttributeValuesPaginatedApiResponseDto })
  findAll(@Query() query: ListAttributeValuesQueryDto) {
    return this.attributesService.findAllValues(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.attributes.read)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_VALUE_FOUND',
    message: 'Attribute value retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک مقدار ویژگی (valueId)' })
  @ApiOkResponse({ type: AttributeValueApiResponseDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.attributesService.findValue(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.attributes.create)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_VALUE_CREATED',
    message: 'Attribute value created successfully',
  })
  @ApiOperation({ summary: 'ایجاد مقدار برای یک ویژگی' })
  @ApiOkResponse({ type: AttributeValueApiResponseDto })
  create(@Body() dto: CreateAttributeValueDto) {
    return this.attributesService.createValue(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.attributes.update)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_VALUE_UPDATED',
    message: 'Attribute value updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش مقدار ویژگی' })
  @ApiOkResponse({ type: AttributeValueApiResponseDto })
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attributesService.updateValue(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.attributes.delete)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_VALUE_DELETED',
    message: 'Attribute value deleted successfully',
  })
  @ApiOperation({ summary: 'حذف مقدار ویژگی' })
  remove(@Param('id', ParseULIDPipe) id: string) {
    return this.attributesService.removeValue(id);
  }
}
