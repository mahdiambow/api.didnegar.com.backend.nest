import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { AttributeRepository } from './repositories/attribute.repository.js';
import {
  CreateAttributeDto,
  UpdateAttributeDto,
  toAttributeResponse,
} from './dto/attribute-response.dto.js';

@Injectable()
export class AttributesService {
  constructor(private readonly attributeRepository: AttributeRepository) {}

  findAllAttributes() {
    return this.attributeRepository
      .findAll()
      .then((items) => items.map((item) => toAttributeResponse(item)));
  }

  async findAttribute(id: string) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) {
      throw new ApiException(
        'ATTRIBUTE_NOT_FOUND',
        'ویژگی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toAttributeResponse(attribute);
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

    return toAttributeResponse(attribute);
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
    return toAttributeResponse(saved);
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
}
