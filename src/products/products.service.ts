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
    variantId?: string;
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
        variantId: query.variantId,
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

    const { variants, variantIds, ...productData } = dto;
    const legacyId = await this.productRepository.getNextLegacyId();

    const product = await this.productRepository.save(
      this.productRepository.create({
        legacyId,
        legacyTable: 'products',
        name: productData.name,
        slug: productData.slug,
        description: productData.description ?? null,
        shortDescription: productData.shortDescription ?? null,
        status: productData.status ?? 'publish',
        sku: productData.sku ?? null,
        brandId: productData.brandId ?? null,
        minPrice: productData.minPrice ?? null,
        maxPrice: productData.maxPrice ?? null,
        isVirtual: productData.isVirtual ?? false,
        isDownloadable: productData.isDownloadable ?? false,
        stockQuantity: productData.stockQuantity ?? null,
        stockStatus: productData.stockStatus ?? null,
        isOnSale: productData.isOnSale ?? false,
        taxStatus: productData.taxStatus ?? null,
        taxClass: productData.taxClass ?? null,
        weight: productData.weight ?? null,
        length: productData.length ?? null,
        width: productData.width ?? null,
        height: productData.height ?? null,
      }),
    );

    await this.syncProductVariants(product.id, variants, variantIds);

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

    const { variants, variantIds, ...productData } = dto;

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
    await this.syncProductVariants(id, variants, variantIds);

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

  private async syncProductVariants(
    productId: string,
    variants?: CreateProductDto['variants'],
    variantIds?: string[],
  ) {
    if (variants?.length) {
      await this.productVariantsService.createManyForProduct(productId, variants);
    }

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
