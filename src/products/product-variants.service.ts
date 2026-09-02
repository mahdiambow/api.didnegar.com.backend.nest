import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductVariantRepository } from './repositories/product-variant.repository.js';
import { ProductVariantAttributeRepository } from './repositories/product-variant-attribute.repository.js';
import { AttributeValueRepository } from './repositories/attribute-value.repository.js';
import {
  AssignVariantAttributeDto,
  CreateProductVariantDto,
  ListProductVariantsQueryDto,
  UpdateProductVariantDto,
  toProductVariantAttributeResponse,
  toProductVariantResponse,
} from './dto/product-variant-response.dto.js';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productVariantAttributeRepository: ProductVariantAttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async findAll(query: ListProductVariantsQueryDto) {
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
      items.map((item) => toProductVariantResponse(item, true)),
      page,
      limit,
      total,
    );
  }

  async findByProductId(productId: string) {
    await this.assertProductExists(productId);
    const items =
      await this.productVariantRepository.findByProductId(productId);
    return items.map((item) => toProductVariantResponse(item, true));
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

    return toProductVariantResponse(variant, true);
  }

  async create(dto: CreateProductVariantDto) {
    await this.assertProductExists(dto.productId);

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

    const variant = await this.productVariantRepository.save(
      this.productVariantRepository.create({
        legacyId,
        legacyTable: 'product_variants',
        productId: dto.productId,
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

    const saved = await this.productVariantRepository.findById(variant.id);
    return toProductVariantResponse(saved!, true);
  }

  async update(id: string, dto: UpdateProductVariantDto) {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'واریانت محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.productId && dto.productId !== variant.productId) {
      await this.assertProductExists(dto.productId);
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
    const updated = await this.productVariantRepository.save(variant);
    const saved = await this.productVariantRepository.findById(updated.id);
    return toProductVariantResponse(saved!, true);
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

  async assignAttribute(variantId: string, dto: AssignVariantAttributeDto) {
    const variant = await this.productVariantRepository.findById(variantId);
    if (!variant) {
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'واریانت محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const attributeValue = await this.attributeValueRepository.findById(
      dto.attributeValueId,
    );
    if (!attributeValue) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_NOT_FOUND',
        'مقدار ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const duplicate =
      await this.productVariantAttributeRepository.findByVariantAndAttributeValue(
        variantId,
        dto.attributeValueId,
      );
    if (duplicate) {
      throw new ApiException(
        'VARIANT_ATTRIBUTE_EXISTS',
        'این ویژگی قبلاً به واریانت اختصاص داده شده',
        HttpStatus.CONFLICT,
      );
    }

    const link = await this.productVariantAttributeRepository.save(
      this.productVariantAttributeRepository.create({
        variantId,
        attributeValueId: dto.attributeValueId,
      }),
    );

    const saved = await this.productVariantAttributeRepository.findById(link.id);
    return toProductVariantAttributeResponse(saved!);
  }

  async removeAttribute(id: string) {
    const link = await this.productVariantAttributeRepository.findById(id);
    if (!link) {
      throw new ApiException(
        'VARIANT_ATTRIBUTE_NOT_FOUND',
        'ارتباط واریانت-ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productVariantAttributeRepository.remove(link);
    return {};
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
