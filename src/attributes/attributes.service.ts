import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { AttributeRepository } from './repositories/attribute.repository.js';
import { AttributeValueRepository } from './repositories/attribute-value.repository.js';
import {
  CreateAttributeDto,
  CreateAttributeValueDto,
  CreateAttributeValueForAttributeDto,
  CreateAttributeValueNestedDto,
  ListAttributeValuesQueryDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto,
  toAttributeResponse,
  toAttributeValueResponse,
} from './dto/attribute-response.dto.js';

@Injectable()
export class AttributesService {
  constructor(
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  findAllAttributes() {
    return this.attributeRepository
      .findAll()
      .then((items) => items.map((item) => toAttributeResponse(item)));
  }

  async findAttribute(id: string) {
    const attribute = await this.attributeRepository.findByIdWithValues(id);
    if (!attribute) {
      throw new ApiException(
        'ATTRIBUTE_NOT_FOUND',
        'ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toAttributeResponse(attribute, true);
  }

  async createAttribute(dto: CreateAttributeDto) {
    const existing = await this.attributeRepository.findByName(dto.name);
    if (existing) {
      throw new ApiException(
        'ATTRIBUTE_NAME_EXISTS',
        'ویژگی با این name از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const legacyId = await this.attributeRepository.getNextLegacyId();
    const attribute = await this.attributeRepository.save(
      this.attributeRepository.create({
        legacyId,
        legacyTable: 'attributes',
        name: dto.name,
        label: dto.label,
        isPublic: dto.isPublic ?? false,
      }),
    );

    if (dto.variantValueIds?.length) {
      await this.linkVariantValuesToVariant(
        attribute.id,
        dto.variantValueIds,
      );
    }

    const saved = await this.attributeRepository.findByIdWithValues(attribute.id);
    return toAttributeResponse(saved!, true);
  }

  async updateAttribute(id: string, dto: UpdateAttributeDto) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) {
      throw new ApiException(
        'ATTRIBUTE_NOT_FOUND',
        'ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.name && dto.name !== attribute.name) {
      const nameTaken = await this.attributeRepository.findByName(dto.name);
      if (nameTaken) {
        throw new ApiException(
          'ATTRIBUTE_NAME_EXISTS',
          'ویژگی با این name از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(attribute, dto);
    await this.attributeRepository.save(attribute);

    const saved = await this.attributeRepository.findByIdWithValues(id);
    return toAttributeResponse(saved!, true);
  }

  async removeAttribute(id: string) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) {
      throw new ApiException(
        'ATTRIBUTE_NOT_FOUND',
        'ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.attributeRepository.remove(attribute);
    return {};
  }

  findValuesByAttribute(attributeId: string) {
    return this.assertAttributeExists(attributeId).then(() =>
      this.attributeValueRepository
        .findByAttributeId(attributeId)
        .then((items) => items.map((item) => toAttributeValueResponse(item))),
    );
  }

  async createValueForAttribute(
    attributeId: string,
    dto: CreateAttributeValueForAttributeDto | CreateAttributeValueNestedDto,
  ) {
    await this.assertAttributeExists(attributeId);

    const existing = await this.attributeValueRepository.findByAttributeAndSlug(
      attributeId,
      dto.slug,
    );
    if (existing) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_SLUG_EXISTS',
        'مقدار با این slug در این ویژگی وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const legacyId = await this.attributeValueRepository.getNextLegacyId();
    const value = await this.attributeValueRepository.save(
      this.attributeValueRepository.create({
        legacyId,
        legacyTable: 'attribute_values',
        attributeId,
        value: dto.value,
        slug: dto.slug,
      }),
    );

    const saved = await this.attributeValueRepository.findById(value.id);
    return toAttributeValueResponse(saved!);
  }

  async findAttributeValues(query: ListAttributeValuesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.attributeValueRepository.findPaginated(
      offset,
      limit,
      { attributeId: query.variantId },
    );

    return paginatedList(
      items.map((item) => toAttributeValueResponse(item, true)),
      page,
      limit,
      total,
    );
  }

  async findAttributeValue(id: string) {
    const value = await this.attributeValueRepository.findById(id);
    if (!value) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_NOT_FOUND',
        'مقدار ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return toAttributeValueResponse(value, true);
  }

  async createAttributeValue(dto: CreateAttributeValueDto) {
    const existing =
      await this.attributeValueRepository.findBySlugWithoutAttribute(dto.slug);
    if (existing) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_SLUG_EXISTS',
        'مقدار با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const legacyId = await this.attributeValueRepository.getNextLegacyId();
    const value = await this.attributeValueRepository.save(
      this.attributeValueRepository.create({
        legacyId,
        legacyTable: 'attribute_values',
        attributeId: null,
        value: dto.value,
        slug: dto.slug,
      }),
    );

    const saved = await this.attributeValueRepository.findById(value.id);
    return toAttributeValueResponse(saved!);
  }

  async updateAttributeValue(id: string, dto: UpdateAttributeValueDto) {
    const value = await this.attributeValueRepository.findById(id);
    if (!value) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_NOT_FOUND',
        'مقدار ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const nextVariantId =
      dto.variantId !== undefined ? dto.variantId : value.attributeId;
    const nextSlug = dto.slug ?? value.slug;

    if (dto.variantId !== undefined && dto.variantId !== null) {
      await this.assertAttributeExists(dto.variantId);

      const duplicate =
        await this.attributeValueRepository.findByAttributeAndSlug(
          dto.variantId,
          nextSlug,
        );
      if (duplicate && duplicate.id !== value.id) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_SLUG_EXISTS',
          'مقدار با این slug در این ویژگی وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    } else if (dto.slug && !value.attributeId) {
      const duplicate =
        await this.attributeValueRepository.findBySlugWithoutAttribute(
          nextSlug,
        );
      if (duplicate && duplicate.id !== value.id) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_SLUG_EXISTS',
          'مقدار با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    } else if (dto.slug && value.attributeId) {
      const duplicate =
        await this.attributeValueRepository.findByAttributeAndSlug(
          value.attributeId,
          nextSlug,
        );
      if (duplicate && duplicate.id !== value.id) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_SLUG_EXISTS',
          'مقدار با این slug در این ویژگی وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (dto.value !== undefined) {
      value.value = dto.value;
    }
    if (dto.slug !== undefined) {
      value.slug = dto.slug;
    }
    if (dto.variantId !== undefined) {
      value.attributeId = dto.variantId;
    }
    const updated = await this.attributeValueRepository.save(value);
    const saved = await this.attributeValueRepository.findById(updated.id);
    return toAttributeValueResponse(saved!, true);
  }

  async removeAttributeValue(id: string) {
    const value = await this.attributeValueRepository.findById(id);
    if (!value) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_NOT_FOUND',
        'مقدار ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.attributeValueRepository.remove(value);
    return {};
  }

  private async linkVariantValuesToVariant(
    variantId: string,
    variantValueIds: string[],
  ) {
    const uniqueIds = [...new Set(variantValueIds)];

    for (const variantValueId of uniqueIds) {
      const value = await this.attributeValueRepository.findById(variantValueId);
      if (!value) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_NOT_FOUND',
          'مقدار ویژگی یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }

      if (value.attributeId && value.attributeId !== variantId) {
        throw new ApiException(
          'VARIANT_VALUE_ALREADY_LINKED',
          'مقدار به واریانت دیگری وصل است',
          HttpStatus.CONFLICT,
        );
      }

      if (value.attributeId === variantId) {
        continue;
      }

      const duplicate =
        await this.attributeValueRepository.findByAttributeAndSlug(
          variantId,
          value.slug,
        );
      if (duplicate && duplicate.id !== value.id) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_SLUG_EXISTS',
          'مقدار با این slug در این ویژگی وجود دارد',
          HttpStatus.CONFLICT,
        );
      }

      value.attributeId = variantId;
      await this.attributeValueRepository.save(value);
    }
  }

  private async assertAttributeExists(attributeId: string) {
    const attribute = await this.attributeRepository.findById(attributeId);
    if (!attribute) {
      throw new ApiException(
        'ATTRIBUTE_NOT_FOUND',
        'ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return attribute;
  }
}
