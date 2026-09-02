import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProductPricingService } from './product-pricing.service.js';
import {
  AdjustProductPricesDto,
  AdjustProductPricesResponseDto,
  ImportProductPricesResponseDto,
} from './dto/adjust-product-prices.dto.js';

const AdjustPricesApiResponseDto = createSuccessResponseDto(
  AdjustProductPricesResponseDto,
  {
    code: 'PRODUCT_PRICES_ADJUSTED',
    message: 'Product prices adjusted successfully',
    name: 'AdjustProductPrices',
  },
);

const ImportPricesApiResponseDto = createSuccessResponseDto(
  ImportProductPricesResponseDto,
  {
    code: 'PRODUCT_PRICES_IMPORTED',
    message: 'Product prices imported successfully',
    name: 'ImportProductPrices',
  },
);

@ApiTags('Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('products/prices')
export class ProductsPricingController {
  constructor(private readonly productPricingService: ProductPricingService) {}

  @Post('adjust')
  @ApiResponseMeta({
    code: 'PRODUCT_PRICES_ADJUSTED',
    message: 'Product prices adjusted successfully',
  })
  @ApiOperation({
    summary: 'تغییر قیمت تکی یا گروهی (درصدی / مبلغ ثابت)',
  })
  @ApiOkResponse({ type: AdjustPricesApiResponseDto })
  adjustPrices(@Body() dto: AdjustProductPricesDto) {
    return this.productPricingService.adjustPrices(dto);
  }

  @Get('export')
  @ApiOperation({ summary: 'دانلود اکسل قیمت محصولات' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportPrices(@Res() res: Response) {
    const buffer = await this.productPricingService.buildExportWorkbook(false);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-prices.xlsx"',
    );
    res.send(Buffer.from(buffer));
  }

  @Get('template')
  @ApiOperation({ summary: 'دانلود اکسل نمونه برای تغییر قیمت' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.productPricingService.buildExportWorkbook(true);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-prices-template.xlsx"',
    );
    res.send(Buffer.from(buffer));
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponseMeta({
    code: 'PRODUCT_PRICES_IMPORTED',
    message: 'Product prices imported successfully',
  })
  @ApiOperation({ summary: 'آپلود اکسل و اعمال قیمت‌ها بر اساس SKU' })
  @ApiOkResponse({ type: ImportPricesApiResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  importPrices(@UploadedFile() file: Express.Multer.File) {
    return this.productPricingService.importFromExcel(file);
  }
}
