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
import { CountriesService } from './locations.service.js';
import {
  CreateCountryDto,
  ListLocationsQueryDto,
  UpdateCountryDto,
} from './dto/location.dto.js';
import { CountryResponseDto } from './dto/location-response.dto.js';

const CountryApiResponseDto = createSuccessResponseDto(CountryResponseDto, {
  code: 'COUNTRY_FOUND',
  message: 'Country retrieved successfully',
  name: 'Country',
});

const CountriesPaginatedApiResponseDto = createPaginatedResponseDto(
  CountryResponseDto,
  {
    code: 'COUNTRIES_FOUND',
    message: 'Countries retrieved successfully',
    name: 'Countries',
  },
);

@ApiTags('Countries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @RequirePermissions(LOCATION_PERMISSIONS.read)
  @ApiResponseMeta({
    code: 'COUNTRIES_FOUND',
    message: 'Countries retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست کشورها' })
  @ApiOkResponse({ type: CountriesPaginatedApiResponseDto })
  findAll(@Query() query: ListLocationsQueryDto) {
    return this.countriesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.read)
  @ApiResponseMeta({
    code: 'COUNTRY_FOUND',
    message: 'Country retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک کشور' })
  @ApiOkResponse({ type: CountryApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.countriesService.findOne(id);
  }

  @Post()
  @RequirePermissions(LOCATION_PERMISSIONS.create)
  @ApiResponseMeta({
    code: 'COUNTRY_CREATED',
    message: 'Country created successfully',
  })
  @ApiOperation({ summary: 'ایجاد کشور' })
  @ApiOkResponse({ type: CountryApiResponseDto })
  create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.update)
  @ApiResponseMeta({
    code: 'COUNTRY_UPDATED',
    message: 'Country updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش کشور' })
  @ApiOkResponse({ type: CountryApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.delete)
  @ApiResponseMeta({
    code: 'COUNTRY_DELETED',
    message: 'Country deleted successfully',
  })
  @ApiOperation({ summary: 'حذف کشور' })
  remove(@Param('id') id: string) {
    return this.countriesService.remove(id);
  }
}
