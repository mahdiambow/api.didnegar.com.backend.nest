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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { BrandsService } from './brands.service.js';
import {
  BrandResponseDto,
  CreateBrandDto,
  UpdateBrandDto,
} from './dto/brand-response.dto.js';
import { ListBrandsQueryDto } from './dto/list-brands-query.dto.js';

const BrandApiResponseDto = createSuccessResponseDto(BrandResponseDto, {
  code: 'BRAND_FOUND',
  message: 'Brand retrieved successfully',
  name: 'Brand',
});

const BrandsPaginatedApiResponseDto = createPaginatedResponseDto(
  BrandResponseDto,
  {
    code: 'BRANDS_FOUND',
    message: 'Brands retrieved successfully',
    name: 'Brands',
  },
);

@ApiTags('Brands')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.brands.read)
  @ApiResponseMeta({
    code: 'BRANDS_FOUND',
    message: 'Brands retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست برندها با pagination و فیلتر' })
  @ApiOkResponse({ type: BrandsPaginatedApiResponseDto })
  findAll(@Query() query: ListBrandsQueryDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.brands.read)
  @ApiResponseMeta({
    code: 'BRAND_FOUND',
    message: 'Brand retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک برند' })
  @ApiOkResponse({ type: BrandApiResponseDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.brands.create)
  @ApiResponseMeta({
    code: 'BRAND_CREATED',
    message: 'Brand created successfully',
  })
  @ApiOperation({ summary: 'ایجاد برند' })
  @ApiOkResponse({ type: BrandApiResponseDto })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.brands.update)
  @ApiResponseMeta({
    code: 'BRAND_UPDATED',
    message: 'Brand updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش برند' })
  @ApiOkResponse({ type: BrandApiResponseDto })
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.brands.delete)
  @ApiResponseMeta({
    code: 'BRAND_DELETED',
    message: 'Brand deleted successfully',
  })
  @ApiOperation({ summary: 'حذف برند' })
  remove(@Param('id', ParseULIDPipe) id: string) {
    return this.brandsService.remove(id);
  }
}
