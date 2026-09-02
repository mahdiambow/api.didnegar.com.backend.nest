import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { AttributeValueRepository } from '../attributes/repositories/attribute-value.repository.js';
import { ProductVariantRepository } from './repositories/product-variant.repository.js';
import { ProductVariantAttributeRepository } from './repositories/product-variant-attribute.repository.js';
import {
  CreateProductAttributeVariantDto,
  ListProductAttributeVariantsQueryDto,
  toProductAttributeVariantResponse,
} from './dto/product-variant-response.dto.js';

@Injectable()
export class ProductVariantAttributesService {
  constructor(
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productVariantAttributeRepository: ProductVariantAttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async findAll(query: ListProductAttributeVariantsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] =
      await this.productVariantAttributeRepository.findPaginated(
        offset,
        limit,
        {
          variantId: query.attributeId,
          attributeValueId: query.variantValueId,
        },
      );

    return paginatedList(
      items.map((item) => toProductAttributeVariantResponse(item)),
      page,
      limit,
      total,
    );
  }

  async findByAttributeId(attributeId: string) {
    await this.assertAttributeExists(attributeId);
    const items =
      await this.productVariantAttributeRepository.findByVariantId(attributeId);
    return items.map((item) => toProductAttributeVariantResponse(item));
  }

  async findOne(id: string) {
    const link = await this.productVariantAttributeRepository.findById(id);
    if (!link) {
      throw new ApiException(
        'PRODUCT_ATTRIBUTE_VARIANT_NOT_FOUND',
        'ارتباط attribute-واریانت یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return toProductAttributeVariantResponse(link);
  }

  async create(dto: CreateProductAttributeVariantDto) {
    await this.assertAttributeExists(dto.attributeId);

    const variantValue = await this.attributeValueRepository.findById(
      dto.variantValueId,
    );
    if (!variantValue) {
      throw new ApiException(
        'VARIANT_VALUE_NOT_FOUND',
        'مقدار واریانت یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const duplicate =
      await this.productVariantAttributeRepository.findByVariantAndAttributeValue(
        dto.attributeId,
        dto.variantValueId,
      );
    if (duplicate) {
      return toProductAttributeVariantResponse(duplicate);
    }

    const link = await this.productVariantAttributeRepository.save(
      this.productVariantAttributeRepository.create({
        variantId: dto.attributeId,
        attributeValueId: dto.variantValueId,
      }),
    );

    const saved = await this.productVariantAttributeRepository.findById(link.id);
    return toProductAttributeVariantResponse(saved!);
  }

  async remove(id: string) {
    const link = await this.productVariantAttributeRepository.findById(id);
    if (!link) {
      throw new ApiException(
        'PRODUCT_ATTRIBUTE_VARIANT_NOT_FOUND',
        'ارتباط attribute-واریانت یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productVariantAttributeRepository.remove(link);
    return {};
  }

  private async assertAttributeExists(attributeId: string) {
    const attribute = await this.productVariantRepository.findById(attributeId);
    if (!attribute) {
      throw new ApiException(
        'PRODUCT_ATTRIBUTE_NOT_FOUND',
        'attribute محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
