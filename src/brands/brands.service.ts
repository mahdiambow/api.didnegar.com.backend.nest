import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { BrandRepository } from './repositories/brand.repository.js';
import {
  CreateBrandDto,
  UpdateBrandDto,
  toBrandResponse,
} from './dto/brand-response.dto.js';
import type { ListBrandsQueryDto } from './dto/list-brands-query.dto.js';

@Injectable()
export class BrandsService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async findAll(query: ListBrandsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.brandRepository.findPaginated(
      offset,
      limit,
      {
        search: query.search,
        name: query.name,
        nameEn: query.nameEn,
        slug: query.slug,
        isActive: query.isActive,
      },
    );

    return paginatedList(items.map(toBrandResponse), page, limit, total);
  }

  findAllActive() {
    return this.brandRepository
      .findAllActive()
      .then((brands) => brands.map(toBrandResponse));
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new ApiException(
        'BRAND_NOT_FOUND',
        'برند یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toBrandResponse(brand);
  }

  async create(dto: CreateBrandDto) {
    const existing = await this.brandRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ApiException(
        'BRAND_SLUG_EXISTS',
        'برند با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const legacyId = await this.brandRepository.getNextLegacyId();
    const brand = await this.brandRepository.save(
      this.brandRepository.create({
        legacyId,
        legacyTable: 'brands',
        name: dto.name,
        nameEn: dto.nameEn ?? null,
        slug: dto.slug,
        logoUrl: dto.logoUrl ?? null,
        seoDescription: dto.seoDescription ?? null,
        isActive: dto.isActive ?? true,
      }),
    );

    return toBrandResponse(brand);
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new ApiException(
        'BRAND_NOT_FOUND',
        'برند یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.slug && dto.slug !== brand.slug) {
      const slugTaken = await this.brandRepository.findBySlug(dto.slug);
      if (slugTaken) {
        throw new ApiException(
          'BRAND_SLUG_EXISTS',
          'برند با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (dto.name !== undefined) brand.name = dto.name;
    if (dto.nameEn !== undefined) brand.nameEn = dto.nameEn;
    if (dto.slug !== undefined) brand.slug = dto.slug;
    if (dto.logoUrl !== undefined) brand.logoUrl = dto.logoUrl;
    if (dto.seoDescription !== undefined) {
      brand.seoDescription = dto.seoDescription;
    }
    if (dto.isActive !== undefined) brand.isActive = dto.isActive;

    const saved = await this.brandRepository.save(brand);
    return toBrandResponse(saved);
  }

  async remove(id: string) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new ApiException(
        'BRAND_NOT_FOUND',
        'برند یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.brandRepository.remove(brand);
    return {};
  }
}
