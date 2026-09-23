import { ParseULIDPipe } from '../common/id/index.js';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { AttributesService } from './attributes.service.js';
import {
  AttributeResponseDto,
  CreateAttributeDto,
  ListAttributesQueryDto,
  UpdateAttributeDto,
} from './dto/attribute-response.dto.js';

const AttributeApiResponseDto = createSuccessResponseDto(AttributeResponseDto, {
  code: 'ATTRIBUTE_FOUND',
  message: 'Attribute retrieved successfully',
  name: 'Attribute',
});

const AttributesPaginatedApiResponseDto = createPaginatedResponseDto(
  AttributeResponseDto,
  {
    code: 'ATTRIBUTES_FOUND',
    message: 'Attributes retrieved successfully',
    name: 'Attributes',
  },
);

@ApiTags('Attributes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.attributes.read)
  @ApiResponseMeta({
    code: 'ATTRIBUTES_FOUND',
    message: 'Attributes retrieved successfully',
  })
  @ApiOperation({
    summary: 'List attributes with pagination',
    description:
      'لیست ویژگی‌ها با pagination — اختیاری: ?includeValues=&valueId=&page=&limit=',
  })
  @ApiOkResponse({ type: AttributesPaginatedApiResponseDto })
  findAll(@Query() query: ListAttributesQueryDto) {
    return this.attributesService.findAllAttributes(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.attributes.read)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_FOUND',
    message: 'Attribute retrieved successfully',
  })
  @ApiOperation({ summary: 'Get one attribute', description: 'دریافت یک ویژگی' })
  @ApiOkResponse({ type: AttributeApiResponseDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.attributesService.findAttribute(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.attributes.create)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_CREATED',
    message: 'Attribute created successfully',
  })
  @ApiOperation({ summary: 'Create attribute', description: 'ایجاد ویژگی' })
  @ApiOkResponse({ type: AttributeApiResponseDto })
  create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.createAttribute(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.attributes.update)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_UPDATED',
    message: 'Attribute updated successfully',
  })
  @ApiOperation({ summary: 'Update attribute', description: 'ویرایش ویژگی' })
  @ApiOkResponse({ type: AttributeApiResponseDto })
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.attributesService.updateAttribute(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.attributes.delete)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_DELETED',
    message: 'Attribute deleted successfully',
  })
  @ApiOperation({ summary: 'Delete attribute', description: 'حذف ویژگی' })
  remove(@Param('id', ParseULIDPipe) id: string) {
    return this.attributesService.removeAttribute(id);
  }
}
