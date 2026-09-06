import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { Product } from './entities/product.entity.js';
import { ProductVariant } from './entities/product-variant.entity.js';
import { ProductVariantAttribute } from './entities/product-variant-attribute.entity.js';
import { AttributeValue } from '../attributes/entities/attribute-value.entity.js';
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
    private readonly variants: ProductVariantRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: ListProductAttributesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.variants.findPaginated(offset, limit, {
      productId: query.productId,
    });
    return paginatedList(
      items.map((item) => toProductAttributeResponse(item)),
      page,
      limit,
      total,
    );
  }
  async findByProductId(productId: string) {
    if (!(await this.productRepository.findById(productId)))
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    return (await this.variants.findByProductId(productId)).map((item) =>
      toProductAttributeResponse(item),
    );
  }
  async findOne(id: string) {
    const variant = await this.variants.findById(id);
    if (!variant)
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'تنوع محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    return toProductAttributeResponse(variant);
  }
  create(dto: CreateProductAttributeDto) {
    return this.saveCombination(dto.productId, dto.attributeValueIds);
  }
  async update(id: string, dto: UpdateProductAttributeDto) {
    const current = await this.findOne(id);
    return this.saveCombination(
      current.productId,
      dto.attributeValueIds ?? current.attributeValueIds,
      id,
    );
  }
  async remove(id: string) {
    const variant = await this.variants.findById(id);
    if (!variant)
      throw new ApiException(
        'PRODUCT_VARIANT_NOT_FOUND',
        'تنوع محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    try {
      await this.variants.remove(variant);
    } catch (error) {
      if ((error as { code?: string }).code === '23503')
        throw new ApiException(
          'VARIANT_IN_USE',
          'تنوع دارای پیشنهاد فروش است',
          HttpStatus.CONFLICT,
        );
      throw error;
    }
    return {};
  }

  private async saveCombination(productId: string, ids: string[], id?: string) {
    return this.dataSource.transaction(async (manager) => {
      // Serialize combination mutations for a product, including concurrent creates.
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product)
        throw new ApiException(
          'PRODUCT_NOT_FOUND',
          'محصول یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      const values = ids.length
        ? await manager.find(AttributeValue, { where: { id: In(ids) } })
        : [];
      if (new Set(ids).size !== ids.length || values.length !== ids.length)
        throw new ApiException(
          'ATTRIBUTE_VALUES_INVALID',
          'مقادیر ویژگی نامعتبر یا تکراری هستند',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      const attributes = values.map((value) => value.attributeId);
      if (
        attributes.some((value) => !value) ||
        new Set(attributes).size !== attributes.length
      )
        throw new ApiException(
          'VARIANT_COMBINATION_INVALID',
          'برای هر ویژگی دقیقاً یک مقدار دارای ویژگی والد انتخاب کنید',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      const all = await manager.find(ProductVariant, {
        where: { productId },
        relations: { variantAttributes: true },
      });
      const key = [...ids].sort().join(',');
      if (
        all.some(
          (v) =>
            v.id !== id &&
            v.variantAttributes
              .map((link) => link.attributeValueId)
              .sort()
              .join(',') === key,
        )
      )
        throw new ApiException(
          'VARIANT_COMBINATION_EXISTS',
          'این ترکیب برای محصول ثبت شده است',
          HttpStatus.CONFLICT,
        );
      const current = id ? all.find((v) => v.id === id) : undefined;
      if (id && !current)
        throw new ApiException(
          'PRODUCT_VARIANT_NOT_FOUND',
          'تنوع محصول یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      if (current) {
        const oldKey = current.variantAttributes
          .map((link) => link.attributeValueId)
          .sort()
          .join(',');
        if (oldKey === key) return toProductAttributeResponse(current);
        const offers = await manager.query(
          'SELECT 1 FROM seller_offers WHERE "variantId" = $1 LIMIT 1',
          [id],
        );
        if (offers.length)
          throw new ApiException(
            'VARIANT_IN_USE',
            'ترکیب دارای پیشنهاد فروش قابل تغییر نیست',
            HttpStatus.CONFLICT,
          );
      }
      const variant =
        current ??
        (await manager.save(
          ProductVariant,
          manager.create(ProductVariant, { productId }),
        ));
      await manager.delete(ProductVariantAttribute, { variantId: variant.id });
      if (ids.length)
        await manager.insert(
          ProductVariantAttribute,
          ids.map((attributeValueId) => ({
            variantId: variant.id,
            attributeValueId,
          })),
        );
      return { id: variant.id, productId, attributeValueIds: [...ids].sort() };
    });
  }
}
