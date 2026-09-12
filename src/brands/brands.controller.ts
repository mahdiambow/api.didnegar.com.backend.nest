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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
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

const BrandApiResponseDto = createSuccessResponseDto(BrandResponseDto, {
  code: 'BRAND_FOUND',
  message: 'Brand retrieved successfully',
  name: 'Brand',
});

const BrandsListApiResponseDto = createSuccessResponseDto(BrandResponseDto, {
  code: 'BRANDS_FOUND',
  message: 'Brands retrieved successfully',
  name: 'BrandsList',
});

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
  @ApiOperation({ summary: 'لیست برندها' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'فقط برندهای فعال',
  })
  @ApiOkResponse({ type: BrandsListApiResponseDto })
  findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true' || activeOnly === '1') {
      return this.brandsService.findAllActive();
    }
    return this.brandsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.brands.read)
  @ApiResponseMeta({
    code: 'BRAND_FOUND',
    message: 'Brand retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک برند' })
  @ApiOkResponse({ type: BrandApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
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
    @Param('id', ParseUUIDPipe) id: string,
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.remove(id);
  }
}
