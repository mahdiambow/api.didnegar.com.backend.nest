import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParseULIDPipe } from '../common/id/index.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { PromotionsService } from './promotions.service.js';
import {
  CreatePromotionDto,
  ListPromotionsQueryDto,
  PreviewPromotionDto,
  PromotionPreviewResponseDto,
  PromotionResponseDto,
  UpdatePromotionDto,
} from './dto/promotion.dto.js';

const PromotionApiDto = createSuccessResponseDto(PromotionResponseDto, {
  code: 'PROMOTION_FOUND',
  message: 'Promotion retrieved successfully',
  name: 'Promotion',
});

const PromotionsPaginatedApiDto = createPaginatedResponseDto(
  PromotionResponseDto,
  {
    code: 'PROMOTIONS_FOUND',
    message: 'Promotions retrieved successfully',
    name: 'Promotions',
  },
);

const PreviewApiDto = createSuccessResponseDto(PromotionPreviewResponseDto, {
  code: 'PROMOTION_PREVIEW',
  message: 'Promotion preview calculated',
  name: 'PromotionPreview',
});

@ApiTags('Promotions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('preview')
  @ApiResponseMeta({
    code: 'PROMOTION_PREVIEW',
    message: 'Promotion preview calculated',
  })
  @ApiOperation({
    summary: 'Preview promotion discount on an existing order',
    description:
      'مبلغ از orderId سمت سرور خوانده می‌شود (products/offerId ارسال نمی‌شود). ' +
      'discountPrice = مبلغ نهایی بعد از پروموشن. اعمال واقعی usage در این endpoint نیست.',
  })
  @ApiOkResponse({ type: PreviewApiDto })
  preview(
    @Req() req: { user: { sub: string } },
    @Body() dto: PreviewPromotionDto,
  ) {
    return this.promotionsService.preview(req.user.sub, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.read)
  @ApiResponseMeta({
    code: 'PROMOTIONS_FOUND',
    message: 'Promotions retrieved successfully',
  })
  @ApiOperation({ summary: 'List promotions (admin)' })
  @ApiOkResponse({ type: PromotionsPaginatedApiDto })
  findAll(@Query() query: ListPromotionsQueryDto) {
    return this.promotionsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.read)
  @ApiResponseMeta({
    code: 'PROMOTION_FOUND',
    message: 'Promotion retrieved successfully',
  })
  @ApiOperation({ summary: 'Get promotion (admin)' })
  @ApiOkResponse({ type: PromotionApiDto })
  findOne(@Param('id', ParseULIDPipe) id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.create)
  @ApiResponseMeta({
    code: 'PROMOTION_CREATED',
    message: 'Promotion created successfully',
  })
  @ApiOperation({ summary: 'Create promotion (admin)' })
  @ApiOkResponse({ type: PromotionApiDto })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.update)
  @ApiResponseMeta({
    code: 'PROMOTION_UPDATED',
    message: 'Promotion updated successfully',
  })
  @ApiOperation({ summary: 'Update promotion (admin)' })
  @ApiOkResponse({ type: PromotionApiDto })
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.delete)
  @ApiResponseMeta({
    code: 'PROMOTION_DELETED',
    message: 'Promotion deleted successfully',
  })
  @ApiOperation({ summary: 'Delete promotion (admin)' })
  remove(@Param('id', ParseULIDPipe) id: string) {
    return this.promotionsService.remove(id);
  }
}
