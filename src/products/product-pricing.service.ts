import { HttpStatus, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ApiException } from '../common/exceptions/api.exception.js';
import { Product } from './entities/product.entity.js';
import { ProductRepository } from './repositories/product.repository.js';
import {
  AdjustProductPricesDto,
  AdjustProductPricesResponseDto,
  ImportProductPricesResponseDto,
  PriceAdjustmentScope,
  PriceApplyTarget,
  ProductPriceChangeItemDto,
} from './dto/adjust-product-prices.dto.js';
import {
  applyPriceAdjustment,
  PRODUCT_PRICE_EXCEL_HEADERS,
  ProductPriceExcelRow,
} from './helpers/product-pricing.helper.js';

@Injectable()
export class ProductPricingService {
  constructor(private readonly productRepository: ProductRepository) {}

  async adjustPrices(
    dto: AdjustProductPricesDto,
  ): Promise<AdjustProductPricesResponseDto> {
    this.validateAdjustDto(dto);

    const applyTo = dto.applyTo ?? PriceApplyTarget.BOTH;
    const { products, notFoundSkus } = await this.resolveProducts(dto);

    if (!products.length) {
      throw new ApiException(
        'NO_PRODUCTS_MATCHED',
        'محصولی برای تغییر قیمت یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const items: ProductPriceChangeItemDto[] = [];

    for (const product of products) {
      const oldMinPrice =
        product.minPrice !== null ? Number(product.minPrice) : null;
      const oldMaxPrice =
        product.maxPrice !== null ? Number(product.maxPrice) : null;

      const adjusted = applyPriceAdjustment(
        oldMinPrice,
        oldMaxPrice,
        dto.adjustmentType,
        dto.direction,
        dto.value,
        applyTo,
      );

      product.minPrice = adjusted.minPrice;
      product.maxPrice = adjusted.maxPrice;

      items.push({
        sku: product.sku ?? '',
        name: product.name,
        oldMinPrice,
        newMinPrice: adjusted.minPrice,
        oldMaxPrice,
        newMaxPrice: adjusted.maxPrice,
      });
    }

    await this.productRepository.saveMany(products);

    return {
      updatedCount: products.length,
      notFoundSkus,
      items,
    };
  }

  async buildExportWorkbook(includeExamples = false): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('product-prices');

    sheet.columns = PRODUCT_PRICE_EXCEL_HEADERS.map((header) => ({
      header,
      key: header,
      width: header === 'name' ? 40 : 20,
    }));

    sheet.getRow(1).font = { bold: true };

    if (includeExamples) {
      sheet.addRow({
        sku: 'SAM-S24U-256',
        name: 'گوشی Galaxy S24 Ultra',
        minPrice: 65000000,
        maxPrice: 72000000,
      });
      sheet.addRow({
        sku: 'APL-IP15P-256',
        name: 'آیفون 15 Pro',
        minPrice: 78000000,
        maxPrice: 85000000,
      });
      return workbook.xlsx.writeBuffer();
    }

    const products = await this.productRepository.findAllForPricingExport();

    for (const product of products) {
      sheet.addRow(this.toExcelRow(product));
    }

    return workbook.xlsx.writeBuffer();
  }

  async importFromExcel(
    file: Express.Multer.File,
  ): Promise<ImportProductPricesResponseDto> {
    if (!file?.buffer?.length) {
      throw new ApiException(
        'FILE_REQUIRED',
        'فایل اکسل الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new ApiException(
        'INVALID_EXCEL_FILE',
        'فایل اکسل معتبر نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    const headerRow = sheet.getRow(1);
    const columnIndex = this.resolveColumnIndexes(headerRow);

    const rows: ProductPriceExcelRow[] = [];
    const errors: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const sku = this.readCellString(row.getCell(columnIndex.sku));
      if (!sku) {
        errors.push(`ردیف ${rowNumber}: sku خالی است`);
        return;
      }

      rows.push({
        sku,
        name: this.readCellString(row.getCell(columnIndex.name)),
        minPrice: this.readCellNumber(row.getCell(columnIndex.minPrice)),
        maxPrice: this.readCellNumber(row.getCell(columnIndex.maxPrice)),
      });
    });

    if (!rows.length) {
      throw new ApiException(
        'EXCEL_ROWS_EMPTY',
        'ردیف معتبری در فایل اکسل یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const skuList = rows.map((row) => row.sku);
    const products = await this.productRepository.findBySkus(skuList);
    const productBySku = new Map(
      products
        .filter((product) => product.sku)
        .map((product) => [product.sku as string, product]),
    );

    const notFoundSkus: string[] = [];
    const toUpdate: Product[] = [];
    let skippedCount = 0;

    for (const row of rows) {
      const product = productBySku.get(row.sku);
      if (!product) {
        notFoundSkus.push(row.sku);
        continue;
      }

      const currentMin =
        product.minPrice !== null ? Number(product.minPrice) : null;
      const currentMax =
        product.maxPrice !== null ? Number(product.maxPrice) : null;
      const nextMin = row.minPrice !== null ? row.minPrice : currentMin;
      const nextMax = row.maxPrice !== null ? row.maxPrice : currentMax;

      if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
        errors.push(
          `SKU ${row.sku}: minPrice نمی‌تواند بیشتر از maxPrice باشد`,
        );
        skippedCount += 1;
        continue;
      }

      let changed = false;

      if (row.minPrice !== null && row.minPrice !== currentMin) {
        product.minPrice = row.minPrice;
        changed = true;
      }

      if (row.maxPrice !== null && row.maxPrice !== currentMax) {
        product.maxPrice = row.maxPrice;
        changed = true;
      }

      if (changed) {
        toUpdate.push(product);
      } else {
        skippedCount += 1;
      }
    }

    if (toUpdate.length) {
      await this.productRepository.saveMany(toUpdate);
    }

    return {
      updatedCount: toUpdate.length,
      skippedCount,
      notFoundSkus,
      errors,
    };
  }

  private validateAdjustDto(dto: AdjustProductPricesDto) {
    if (dto.scope === PriceAdjustmentScope.SINGLE) {
      if (!dto.skus?.length) {
        throw new ApiException(
          'SKUS_REQUIRED',
          'برای تغییر تکی، لیست SKU الزامی است',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private async resolveProducts(dto: AdjustProductPricesDto) {
    if (dto.scope === PriceAdjustmentScope.SINGLE) {
      const skus = [...new Set(dto.skus ?? [])];
      const products = await this.productRepository.findBySkus(skus);
      const foundSkus = new Set(
        products.map((product) => product.sku).filter(Boolean),
      );
      const notFoundSkus = skus.filter((sku) => !foundSkus.has(sku));

      return { products, notFoundSkus };
    }

    const products = await this.productRepository.findByFilters({
      brandId: dto.brandId,
      status: dto.status,
      name: dto.name,
    });

    return { products, notFoundSkus: [] as string[] };
  }

  private toExcelRow(product: Product): ProductPriceExcelRow {
    return {
      sku: product.sku ?? '',
      name: product.name,
      minPrice: product.minPrice !== null ? Number(product.minPrice) : null,
      maxPrice: product.maxPrice !== null ? Number(product.maxPrice) : null,
    };
  }

  private resolveColumnIndexes(headerRow: ExcelJS.Row) {
    const indexes: Record<string, number> = {};

    headerRow.eachCell((cell, colNumber) => {
      const value = this.readCellString(cell).toLowerCase();
      indexes[value] = colNumber;
    });

    for (const header of PRODUCT_PRICE_EXCEL_HEADERS) {
      if (!indexes[header]) {
        throw new ApiException(
          'INVALID_EXCEL_HEADERS',
          `ستون ${header} در فایل اکسل یافت نشد`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return {
      sku: indexes.sku,
      name: indexes.name,
      minPrice: indexes.minprice,
      maxPrice: indexes.maxprice,
    };
  }

  private readCellString(cell: ExcelJS.Cell): string {
    const value = cell.value;
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object' && 'text' in value) {
      return String(value.text).trim();
    }

    return String(value).trim();
  }

  private readCellNumber(cell: ExcelJS.Cell): number | null {
    const value = cell.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return Math.max(0, parsed);
  }
}
