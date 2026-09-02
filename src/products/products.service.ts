import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import {
  toBrandResponse,
  toProductResponse,
} from './dto/product-response.dto.js';
import { BrandRepository } from './repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    brandId?: string;
    name?: string;
    isOnSale?: boolean;
    stockStatus?: string;
  }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.productRepository.findPaginated(
      offset,
      limit,
      {
        status: query.status,
        brandId: query.brandId,
        name: query.name,
        isOnSale: query.isOnSale,
        stockStatus: query.stockStatus,
      },
      true,
    );

    return paginatedList(
      items.map((item) => toProductResponse(item, true)),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    const product = await this.productRepository.findById(id, true);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toProductResponse(product, true);
  }

  async create(dto: CreateProductDto) {
    await this.assertUniqueFields(dto.slug, dto.sku);
    if (dto.brandId) {
      await this.assertBrandExists(dto.brandId);
    }

    const legacyId = await this.productRepository.getNextLegacyId();

    const product = await this.productRepository.save(
      this.productRepository.create({
        legacyId,
        legacyTable: 'products',
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        shortDescription: dto.shortDescription ?? null,
        status: dto.status ?? 'publish',
        sku: dto.sku ?? null,
        brandId: dto.brandId ?? null,
        minPrice: dto.minPrice ?? null,
        maxPrice: dto.maxPrice ?? null,
        isVirtual: dto.isVirtual ?? false,
        isDownloadable: dto.isDownloadable ?? false,
        stockQuantity: dto.stockQuantity ?? null,
        stockStatus: dto.stockStatus ?? null,
        isOnSale: dto.isOnSale ?? false,
        taxStatus: dto.taxStatus ?? null,
        taxClass: dto.taxClass ?? null,
        weight: dto.weight ?? null,
        length: dto.length ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
      }),
    );

    return toProductResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.slug && dto.slug !== product.slug) {
      const slugTaken = await this.productRepository.findBySlug(dto.slug);
      if (slugTaken) {
        throw new ApiException(
          'PRODUCT_SLUG_EXISTS',
          'محصول با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (dto.sku && dto.sku !== product.sku) {
      const skuTaken = await this.productRepository.findBySku(dto.sku);
      if (skuTaken) {
        throw new ApiException(
          'PRODUCT_SKU_EXISTS',
          'محصول با این SKU از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (dto.brandId) {
      await this.assertBrandExists(dto.brandId);
    }

    Object.assign(product, dto);
    const updated = await this.productRepository.save(product);
    return toProductResponse(updated);
  }

  async remove(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productRepository.remove(product);
    return {};
  }

  findAllBrands() {
    return this.brandRepository
      .findAll()
      .then((brands) => brands.map(toBrandResponse));
  }

  private async assertUniqueFields(slug: string, sku?: string) {
    const slugTaken = await this.productRepository.findBySlug(slug);
    if (slugTaken) {
      throw new ApiException(
        'PRODUCT_SLUG_EXISTS',
        'محصول با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    if (sku) {
      const skuTaken = await this.productRepository.findBySku(sku);
      if (skuTaken) {
        throw new ApiException(
          'PRODUCT_SKU_EXISTS',
          'محصول با این SKU از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  private async assertBrandExists(brandId: string) {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new ApiException(
        'BRAND_NOT_FOUND',
        'برند یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
