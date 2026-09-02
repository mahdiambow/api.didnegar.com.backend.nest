import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { toProductEntityData } from './dto/product-fields.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import {
  toBrandResponse,
  toProductResponse,
} from './dto/product-response.dto.js';
import { BrandRepository } from './repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductVariantsService } from './product-variants.service.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    brandId?: string;
    name?: string;
    isOnSale?: boolean;
    stockStatus?: string;
    categoryId?: string;
    subCategoryId?: string;
    attributeId?: string;
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
        categoryId: query.categoryId,
        subCategoryId: query.subCategoryId,
        attributeId: query.attributeId,
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
    const { variantIds, ...productData } = dto;

    await this.assertUniqueFields(productData.slug, productData.sku);
    if (productData.brandId) {
      await this.assertBrandExists(productData.brandId);
    }

    const legacyId = await this.productRepository.getNextLegacyId();
    const product = await this.productRepository.save(
      this.productRepository.create(
        toProductEntityData(productData, legacyId),
      ),
    );

    await this.syncVariantIds(product.id, variantIds);

    const loaded = await this.productRepository.findById(product.id, true);
    return toProductResponse(loaded!, true);
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

    const { variantIds, ...productData } = dto;

    if (productData.slug && productData.slug !== product.slug) {
      const slugTaken = await this.productRepository.findBySlug(productData.slug);
      if (slugTaken) {
        throw new ApiException(
          'PRODUCT_SLUG_EXISTS',
          'محصول با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (productData.sku && productData.sku !== product.sku) {
      const skuTaken = await this.productRepository.findBySku(productData.sku);
      if (skuTaken) {
        throw new ApiException(
          'PRODUCT_SKU_EXISTS',
          'محصول با این SKU از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (productData.brandId) {
      await this.assertBrandExists(productData.brandId);
    }

    Object.assign(product, productData);
    await this.productRepository.save(product);
    await this.syncVariantIds(id, variantIds);

    const loaded = await this.productRepository.findById(id, true);
    return toProductResponse(loaded!, true);
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

  private async syncVariantIds(productId: string, variantIds?: string[]) {
    if (variantIds?.length) {
      await this.productVariantsService.assignVariantIdsToProduct(
        productId,
        variantIds,
      );
    }
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
