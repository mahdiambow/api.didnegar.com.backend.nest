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
import { LOCATION_PERMISSIONS } from '../roles/permissions.js';
import { CitiesService } from './locations.service.js';
import {
  CreateCityDto,
  ListCitiesQueryDto,
  UpdateCityDto,
} from './dto/location.dto.js';
import { CityResponseDto } from './dto/location-response.dto.js';

const CityApiResponseDto = createSuccessResponseDto(CityResponseDto, {
  code: 'CITY_FOUND',
  message: 'City retrieved successfully',
  name: 'City',
});

const CitiesPaginatedApiResponseDto = createPaginatedResponseDto(
  CityResponseDto,
  {
    code: 'CITIES_FOUND',
    message: 'Cities retrieved successfully',
    name: 'Cities',
  },
);

@ApiTags('Cities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @RequirePermissions(LOCATION_PERMISSIONS.read)
  @ApiResponseMeta({
    code: 'CITIES_FOUND',
    message: 'Cities retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست شهرها' })
  @ApiOkResponse({ type: CitiesPaginatedApiResponseDto })
  findAll(@Query() query: ListCitiesQueryDto) {
    return this.citiesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.read)
  @ApiResponseMeta({
    code: 'CITY_FOUND',
    message: 'City retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک شهر' })
  @ApiOkResponse({ type: CityApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  @Post()
  @RequirePermissions(LOCATION_PERMISSIONS.create)
  @ApiResponseMeta({
    code: 'CITY_CREATED',
    message: 'City created successfully',
  })
  @ApiOperation({ summary: 'ایجاد شهر' })
  @ApiOkResponse({ type: CityApiResponseDto })
  create(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.update)
  @ApiResponseMeta({
    code: 'CITY_UPDATED',
    message: 'City updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش شهر' })
  @ApiOkResponse({ type: CityApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.citiesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.delete)
  @ApiResponseMeta({
    code: 'CITY_DELETED',
    message: 'City deleted successfully',
  })
  @ApiOperation({ summary: 'حذف شهر' })
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
}
