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
import { StatesService } from './locations.service.js';
import {
  CreateStateDto,
  ListStatesQueryDto,
  UpdateStateDto,
} from './dto/location.dto.js';
import { StateResponseDto } from './dto/location-response.dto.js';

const StateApiResponseDto = createSuccessResponseDto(StateResponseDto, {
  code: 'STATE_FOUND',
  message: 'State retrieved successfully',
  name: 'State',
});

const StatesPaginatedApiResponseDto = createPaginatedResponseDto(
  StateResponseDto,
  {
    code: 'STATES_FOUND',
    message: 'States retrieved successfully',
    name: 'States',
  },
);

@ApiTags('States')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @RequirePermissions(LOCATION_PERMISSIONS.read)
  @ApiResponseMeta({
    code: 'STATES_FOUND',
    message: 'States retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست استان‌ها' })
  @ApiOkResponse({ type: StatesPaginatedApiResponseDto })
  findAll(@Query() query: ListStatesQueryDto) {
    return this.statesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.read)
  @ApiResponseMeta({
    code: 'STATE_FOUND',
    message: 'State retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک استان' })
  @ApiOkResponse({ type: StateApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.statesService.findOne(id);
  }

  @Post()
  @RequirePermissions(LOCATION_PERMISSIONS.create)
  @ApiResponseMeta({
    code: 'STATE_CREATED',
    message: 'State created successfully',
  })
  @ApiOperation({ summary: 'ایجاد استان' })
  @ApiOkResponse({ type: StateApiResponseDto })
  create(@Body() dto: CreateStateDto) {
    return this.statesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.update)
  @ApiResponseMeta({
    code: 'STATE_UPDATED',
    message: 'State updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش استان' })
  @ApiOkResponse({ type: StateApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateStateDto) {
    return this.statesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(LOCATION_PERMISSIONS.delete)
  @ApiResponseMeta({
    code: 'STATE_DELETED',
    message: 'State deleted successfully',
  })
  @ApiOperation({ summary: 'حذف استان' })
  remove(@Param('id') id: string) {
    return this.statesService.remove(id);
  }
}
