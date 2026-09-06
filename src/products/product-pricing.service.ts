import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { SellerOffer } from '../offers/entities/seller-offer.entity.js';
import { assertOfferAccess } from '../offers/offers.service.js';
import { AdjustProductPricesDto } from './dto/adjust-product-prices.dto.js';
@Injectable()
export class ProductPricingService {
  constructor(
    @InjectRepository(SellerOffer)
    private readonly offers: Repository<SellerOffer>,
  ) {}
  async adjustPrices(user: AuthUser, dto: AdjustProductPricesDto) {
    const offers = await this.loadAuthorized(user, dto.offerIds);
    const items = offers.map((offer) => {
      const oldPrice = Number(offer.price);
      const amount =
        dto.adjustmentType === 'percentage'
          ? (oldPrice * dto.value) / 100
          : dto.value;
      const newPrice = Number(
        Math.max(
          0,
          oldPrice + (dto.direction === 'increase' ? amount : -amount),
        ).toFixed(4),
      );
      this.assertPrice(newPrice);
      offer.price = newPrice;
      return { offerId: offer.id, sku: offer.sku, oldPrice, newPrice };
    });
    await this.offers.save(offers);
    return { updatedCount: offers.length, items };
  }
  async buildExportWorkbook(
    user: AuthUser,
    includeExamples = false,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('seller-offer-prices');
    sheet.columns = ['offerId', 'sellerId', 'sku', 'price'].map((key) => ({
      header: key,
      key,
      width: key.endsWith('Id') ? 40 : 24,
    }));
    if (includeExamples)
      sheet.addRow({
        offerId: '550e8400-e29b-41d4-a716-446655440000',
        sellerId: '550e8400-e29b-41d4-a716-446655440001',
        sku: 'SAM-S24U-256-BLU',
        price: 68000000,
      });
    else {
      if (user.role !== 'super-admin')
        assertOfferAccess(user, user.sellerId ?? '');
      const offers = await this.offers.find({
        where: user.role === 'super-admin' ? {} : { sellerId: user.sellerId! },
        order: { id: 'ASC' },
      });
      for (const offer of offers)
        sheet.addRow({
          offerId: offer.id,
          sellerId: offer.sellerId,
          sku: offer.sku,
          price: Number(offer.price),
        });
    }
    return workbook.xlsx.writeBuffer();
  }
  async importFromExcel(user: AuthUser, file: Express.Multer.File) {
    if (!file?.buffer?.length)
      throw new ApiException(
        'FILE_REQUIRED',
        'فایل اکسل الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new ApiException(
        'INVALID_EXCEL_FILE',
        'فایل اکسل معتبر نیست',
        HttpStatus.BAD_REQUEST,
      );
    }
    const sheet = workbook.worksheets[0];
    const columns: Record<string, number> = {};
    sheet?.getRow(1).eachCell((cell, index) => {
      columns[String(cell.value).toLowerCase()] = index;
    });
    if (!sheet || !columns.offerid || !columns.price)
      throw new ApiException(
        'INVALID_EXCEL_HEADERS',
        'ستون‌های offerId و price الزامی هستند',
        HttpStatus.BAD_REQUEST,
      );
    const rows = new Map<string, number>();
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const id = String(row.getCell(columns.offerid).value ?? '').trim();
      const raw = row.getCell(columns.price).value;
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        ) ||
        raw === null ||
        raw === '' ||
        typeof raw !== 'number' ||
        rows.has(id)
      )
        throw new ApiException(
          'INVALID_EXCEL_ROW',
          `ردیف ${index} نامعتبر یا تکراری است`,
          HttpStatus.BAD_REQUEST,
        );
      this.assertPrice(raw);
      rows.set(id, raw);
    });
    if (!rows.size)
      throw new ApiException(
        'EXCEL_ROWS_EMPTY',
        'فایل بدون ردیف قیمت است',
        HttpStatus.BAD_REQUEST,
      );
    const offers = await this.loadAuthorized(user, [...rows.keys()]);
    for (const offer of offers) offer.price = rows.get(offer.id)!;
    await this.offers.save(offers);
    return { updatedCount: offers.length };
  }
  private async loadAuthorized(user: AuthUser, ids: string[]) {
    const offers = await this.offers.findBy({ id: In(ids) });
    if (offers.length !== new Set(ids).size)
      throw new ApiException(
        'OFFER_NOT_FOUND',
        'یک یا چند پیشنهاد فروش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    for (const offer of offers) assertOfferAccess(user, offer.sellerId);
    return offers;
  }
  private assertPrice(price: number) {
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 999999999999999 ||
      Math.abs(price * 10000 - Math.round(price * 10000)) > 0.001
    )
      throw new ApiException(
        'PRICE_INVALID',
        'قیمت معتبر با حداکثر چهار رقم اعشار وارد کنید',
        HttpStatus.BAD_REQUEST,
      );
  }
}
