import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Banner } from './entities/banner.entity.js';
import {
  CreateBannerDto,
  ListBannersQueryDto,
  UpdateBannerDto,
} from './dto/banner.dto.js';
import { BannerPage, BannerSection } from './types/banner.enums.js';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner) private readonly banners: Repository<Banner>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async findAll(query: ListBannersQueryDto) {
    const { page, limit, offset } = getPaginationParams({
      page: query.pageNumber,
      limit: query.limit,
    });
    const [items, total] = await this.banners.findAndCount({
      where: {
        ...(query.page ? { page: query.page } : {}),
        ...(query.section ? { section: query.section } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: offset,
      take: limit,
    });
    return paginatedList(items, page, limit, total);
  }

  async findOne(id: string) {
    const banner = await this.banners.findOneBy({ id });
    if (!banner) {
      throw new ApiException(
        'BANNER_NOT_FOUND',
        'بنر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return banner;
  }

  async create(dto: CreateBannerDto) {
    const banner = this.banners.create({
      ...dto,
      categoryId: dto.categoryId ?? null,
    });
    await this.validatePlacement(banner);
    return this.save(banner);
  }

  async update(id: string, dto: UpdateBannerDto) {
    const banner = await this.findOne(id);
    Object.assign(banner, dto);
    await this.validatePlacement(banner);
    return this.save(banner);
  }

  async remove(id: string) {
    const result = await this.banners.delete({ id });
    if (!result.affected) {
      throw new ApiException(
        'BANNER_NOT_FOUND',
        'بنر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return {};
  }

  private async validatePlacement(banner: Banner) {
    const isHome = banner.page === BannerPage.HOME;
    if (
      (isHome &&
        (banner.categoryId !== null ||
          banner.section === BannerSection.SIDEBAR)) ||
      (!isHome &&
        (banner.page !== BannerPage.CATEGORY_SIDEBAR ||
          !banner.categoryId ||
          banner.section !== BannerSection.SIDEBAR))
    ) {
      throw new ApiException(
        'BANNER_PLACEMENT_INVALID',
        'بخش و دسته‌بندی با محل نمایش بنر سازگار نیست',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const count = banner.items.length;
    const expected =
      banner.section === BannerSection.THREE_IMAGES
        ? 3
        : banner.section === BannerSection.TWO_IMAGES
          ? 2
          : 1;
    if (
      banner.section === BannerSection.MAIN_SLIDER
        ? count < 1 || count > 50
        : count !== expected
    ) {
      throw new ApiException(
        'BANNER_ITEMS_COUNT_INVALID',
        'تعداد آیتم‌ها با بخش انتخاب‌شده سازگار نیست',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (
      banner.categoryId &&
      !(await this.categories.existsBy({ id: banner.categoryId }))
    ) {
      throw new ApiException(
        'CATEGORY_NOT_FOUND',
        'دسته‌بندی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async save(banner: Banner) {
    try {
      return await this.banners.save(banner);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505') {
        throw new ApiException(
          'BANNER_ALREADY_EXISTS',
          'برای این محل نمایش بنر ثبت شده است؛ آن را ویرایش کنید',
          HttpStatus.CONFLICT,
        );
      }
      if (code === '23503') {
        throw new ApiException(
          'CATEGORY_NOT_FOUND',
          'دسته‌بندی یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }
}
