import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { UserAddress } from '../users/entities/user-address.entity.js';
import { toUserAddressResponse } from '../utils/auth/dto/user-response.dto.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly addresses: Repository<UserAddress>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(userId: string) {
    const items = await this.addresses.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    return items.map(toUserAddressResponse);
  }

  async findOne(userId: string, id: string) {
    return toUserAddressResponse(await this.findOwned(userId, id));
  }

  async create(userId: string, dto: CreateAddressDto) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserAddress);
      const isDefault = dto.isDefault ?? false;
      if (isDefault) {
        await repo.update({ userId }, { isDefault: false });
      }
      return repo.save(
        repo.create({
          userId,
          title: dto.title,
          province: dto.province,
          city: dto.city,
          addressDetail: dto.addressDetail,
          postalCode: dto.postalCode ?? null,
          plaque: dto.plaque ?? null,
          unit: dto.unit ?? null,
          description: dto.description ?? null,
          lat: dto.lat ?? null,
          long: dto.long ?? null,
          recipientFullName: dto.recipientFullName,
          recipientPhone: dto.recipientPhone ?? null,
          isDefault,
        }),
      );
    });
    return toUserAddressResponse(saved);
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.findOwned(userId, id);
    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserAddress);
      if (dto.isDefault === true) {
        await repo.update({ userId }, { isDefault: false });
      }
      Object.assign(address, {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.addressDetail !== undefined && {
          addressDetail: dto.addressDetail,
        }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.plaque !== undefined && { plaque: dto.plaque }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.long !== undefined && { long: dto.long }),
        ...(dto.recipientFullName !== undefined && {
          recipientFullName: dto.recipientFullName,
        }),
        ...(dto.recipientPhone !== undefined && {
          recipientPhone: dto.recipientPhone,
        }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      });
      return repo.save(address);
    });
    return toUserAddressResponse(saved);
  }

  async remove(userId: string, id: string) {
    const address = await this.findOwned(userId, id);
    await this.addresses.remove(address);
    return { id };
  }

  async resolveForUser(userId: string, addressId: string): Promise<UserAddress> {
    return this.findOwned(userId, addressId);
  }

  private async findOwned(userId: string, id: string): Promise<UserAddress> {
    const address = await this.addresses.findOneBy({ id, userId });
    if (!address) {
      throw new ApiException(
        'ADDRESS_NOT_FOUND',
        'آدرس یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return address;
  }
}
