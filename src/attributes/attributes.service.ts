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
  ListAttributesQueryDto,
  UpdateAttributeDto,
  toAttributeResponse,
} from './dto/attribute-response.dto.js';
import {
  CreateAttributeValueDto,
  ListAttributeValuesQueryDto,
  UpdateAttributeValueDto,
  toAttributeValueResponse,
} from './dto/attribute-value.dto.js';

@Injectable()
export class AttributesService {
  constructor(
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async findAllAttributes(query: ListAttributesQueryDto = {} as ListAttributesQueryDto) {
    if (query.valueId) {
      const value = await this.attributeValueRepository.findById(query.valueId);
      if (!value) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_NOT_FOUND',
          'مقدار ویژگی یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      const attribute = await this.attributeRepository.findByIdWithValues(
        value.attributeId,
      );
      if (!attribute) {
        throw new ApiException(
          'ATTRIBUTE_NOT_FOUND',
          'ویژگی یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      return paginatedList([toAttributeResponse(attribute, true)], 1, 1, 1);
    }

    const { page, limit, offset } = getPaginationParams(query);
    const includeValues = query.includeValues === true;
    const [items, total] = await this.attributeRepository.findPaginated(
      offset,
      limit,
      { includeValues },
    );

    return paginatedList(
      items.map((item) => toAttributeResponse(item, includeValues)),
      page,
      limit,
      total,
    );
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

    return toAttributeResponse({ ...attribute, values: [] }, true);
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
    const saved = await this.attributeRepository.save(attribute);
    const values = await this.attributeValueRepository.findByAttributeId(
      saved.id,
    );
    return toAttributeResponse({ ...saved, values }, true);
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

  async findAllValues(query: ListAttributeValuesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.attributeValueRepository.findPaginated(
      offset,
      limit,
      {
        attributeId: query.attributeId,
        isActive: query.isActive,
      },
    );

    return paginatedList(
      items.map(toAttributeValueResponse),
      page,
      limit,
      total,
    );
  }

  async findValue(id: string) {
    const value = await this.attributeValueRepository.findById(id);
    if (!value) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_NOT_FOUND',
        'مقدار ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toAttributeValueResponse(value);
  }

  async createValue(dto: CreateAttributeValueDto) {
    await this.assertAttributeExists(dto.attributeId);

    const existing = await this.attributeValueRepository.findByAttributeAndValue(
      dto.attributeId,
      dto.value,
    );
    if (existing) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_EXISTS',
        'این value برای ویژگی از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const legacyId = await this.attributeValueRepository.getNextLegacyId();
    const value = await this.attributeValueRepository.save(
      this.attributeValueRepository.create({
        legacyId,
        legacyTable: 'attribute_values',
        attributeId: dto.attributeId,
        value: dto.value,
        label: dto.label,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      }),
    );

    return toAttributeValueResponse(value);
  }

  async updateValue(id: string, dto: UpdateAttributeValueDto) {
    const value = await this.attributeValueRepository.findById(id);
    if (!value) {
      throw new ApiException(
        'ATTRIBUTE_VALUE_NOT_FOUND',
        'مقدار ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.attributeId && dto.attributeId !== value.attributeId) {
      await this.assertAttributeExists(dto.attributeId);
    }

    const attributeId = dto.attributeId ?? value.attributeId;
    const nextValue = dto.value ?? value.value;
    if (
      (dto.value && dto.value !== value.value) ||
      (dto.attributeId && dto.attributeId !== value.attributeId)
    ) {
      const taken = await this.attributeValueRepository.findByAttributeAndValue(
        attributeId,
        nextValue,
      );
      if (taken && taken.id !== value.id) {
        throw new ApiException(
          'ATTRIBUTE_VALUE_EXISTS',
          'این value برای ویژگی از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(value, dto);
    const saved = await this.attributeValueRepository.save(value);
    return toAttributeValueResponse(saved);
  }

  async removeValue(id: string) {
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

  private async assertAttributeExists(attributeId: string) {
    const attribute = await this.attributeRepository.findById(attributeId);
    if (!attribute) {
      throw new ApiException(
        'ATTRIBUTE_NOT_FOUND',
        'ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
