import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { AttributesService } from './attributes.service.js';
import {
  AttributeResponseDto,
  CreateAttributeDto,
  UpdateAttributeDto,
} from './dto/attribute-response.dto.js';

const AttributeApiResponseDto = createSuccessResponseDto(AttributeResponseDto, {
  code: 'ATTRIBUTE_FOUND',
  message: 'Attribute retrieved successfully',
  name: 'Attribute',
});

const AttributesListApiResponseDto = createSuccessResponseDto(
  AttributeResponseDto,
  {
    code: 'ATTRIBUTES_FOUND',
    message: 'Attributes retrieved successfully',
    name: 'AttributesList',
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
  @ApiOperation({ summary: 'لیست ویژگی‌ها' })
  @ApiOkResponse({ type: AttributesListApiResponseDto })
  findAll() {
    return this.attributesService.findAllAttributes();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.attributes.read)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_FOUND',
    message: 'Attribute retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک ویژگی' })
  @ApiOkResponse({ type: AttributeApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.findAttribute(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.attributes.create)
  @ApiResponseMeta({
    code: 'ATTRIBUTE_CREATED',
    message: 'Attribute created successfully',
  })
  @ApiOperation({ summary: 'ایجاد ویژگی' })
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
  @ApiOperation({ summary: 'ویرایش ویژگی' })
  @ApiOkResponse({ type: AttributeApiResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
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
  @ApiOperation({ summary: 'حذف ویژگی' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.removeAttribute(id);
  }
}
