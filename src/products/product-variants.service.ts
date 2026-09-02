import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductVariantRepository } from './repositories/product-variant.repository.js';
import {
  CreateProductAttributeDto,
  ListProductAttributesQueryDto,
  UpdateProductAttributeDto,
  toProductAttributeResponse,
} from './dto/product-variant-response.dto.js';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async findAll(query: ListProductAttributesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.productVariantRepository.findPaginated(
      offset,
      limit,
      {
        productId: query.productId,
        isActive: query.isActive,
      },
    );

    return paginatedList(
      items.map((item) => toProductAttributeResponse(item, true)),
      page,
      limit,
      total,
    );
  }

  async findByProductId(productId: string) {
    await this.assertProductExists(productId);
    const items =
      await this.productVariantRepository.findByProductId(productId);
    return items.map((item) => toProductAttributeResponse(item, true));
  }

  async findOne(id: string) {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'واریانت محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return toProductAttributeResponse(variant, true);
  }

  async create(dto: CreateProductAttributeDto) {
    await this.assertProductExists(dto.productId);
    const variant = await this.createVariant(dto.productId, dto);
    const saved = await this.productVariantRepository.findById(variant.id);
    return toProductAttributeResponse(saved!, true);
  }

  async assignAttributeIdsToProduct(productId: string, attributeIds: string[]) {
    if (!attributeIds.length) {
      return;
    }

    await this.assertProductExists(productId);

    const uniqueIds = [...new Set(attributeIds)];
    const variants = await this.productVariantRepository.findByIds(uniqueIds);

    if (variants.length !== uniqueIds.length) {
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'یک یا چند واریانت یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    for (const variant of variants) {
      variant.productId = productId;
    }

    await this.productVariantRepository.saveMany(variants);
  }

  async update(id: string, dto: UpdateProductAttributeDto) {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'واریانت محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.sku && dto.sku !== variant.sku) {
      const skuTaken = await this.productVariantRepository.findBySku(dto.sku);
      if (skuTaken) {
        throw new ApiException(
          'PRODUCT_VARIANT_SKU_EXISTS',
          'واریانت با این SKU از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(variant, dto);
    await this.productVariantRepository.save(variant);

    const saved = await this.productVariantRepository.findById(id);
    return toProductAttributeResponse(saved!, true);
  }

  async remove(id: string) {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'واریانت محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productVariantRepository.remove(variant);
    return {};
  }

  private async createVariant(
    productId: string,
    dto: Omit<CreateProductAttributeDto, 'productId'>,
  ) {
    if (dto.sku) {
      const skuTaken = await this.productVariantRepository.findBySku(dto.sku);
      if (skuTaken) {
        throw new ApiException(
          'PRODUCT_VARIANT_SKU_EXISTS',
          'واریانت با این SKU از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    const legacyId = await this.productVariantRepository.getNextLegacyId();

    return this.productVariantRepository.save(
      this.productVariantRepository.create({
        legacyId,
        legacyTable: 'product_variants',
        productId,
        sku: dto.sku ?? null,
        minPrice: dto.minPrice ?? null,
        maxPrice: dto.maxPrice ?? null,
        isVirtual: dto.isVirtual ?? false,
        isDownloadable: dto.isDownloadable ?? false,
        stockQuantity: dto.stockQuantity ?? null,
        stockStatus: dto.stockStatus ?? null,
        taxStatus: dto.taxStatus ?? null,
        taxClass: dto.taxClass ?? null,
        description: dto.description ?? null,
        status: dto.status ?? 'publish',
        weight: dto.weight ?? null,
        length: dto.length ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  private async assertProductExists(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
