import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { canAccessSellerData } from '../common/tenant/tenant-access.js';
import { isSuperAdmin } from '../common/tenant/tenant-scope.js';
import type { TenantScope } from '../common/tenant/tenant-scope.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { UserRepository } from '../auth/repositories/user.repository.js';
import { SellerRepository } from './repositories/seller.repository.js';
import { SellerContractRepository } from './repositories/seller-contract.repository.js';
import { CreateSellerContractDto } from './dto/create-seller-contract.dto.js';
import { UpdateSellerContractDto } from './dto/update-seller-contract.dto.js';
import { toSellerContractResponse } from './dto/seller-contract-response.dto.js';

@Injectable()
export class SellerContractsService {
  constructor(
    private readonly sellerRepository: SellerRepository,
    private readonly contractRepository: SellerContractRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async findAll(
    scope: TenantScope,
    query: {
      page?: string | number;
      limit?: string | number;
      sellerId?: string;
    },
  ) {
    const { page, limit, offset } = getPaginationParams(query);

    if (query.sellerId) {
      this.assertSellerAccessible(scope, query.sellerId);
    }

    const [items, total] =
      await this.contractRepository.findPaginatedForTenant(offset, limit, {
        sellerId: scope.sellerId,
        isSuperAdmin: isSuperAdmin(scope),
        filterSellerId: query.sellerId,
      });

    return paginatedList(
      items.map(toSellerContractResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(scope: TenantScope, id: string) {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new ApiException(
        'CONTRACT_NOT_FOUND',
        'قرارداد یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerAccessible(scope, contract.sellerId);
    return toSellerContractResponse(contract);
  }

  async create(scope: TenantScope, dto: CreateSellerContractDto) {
    const sellerId = await this.resolveSellerId(dto.sellerId);

    if (sellerId) {
      this.assertSellerAccessible(scope, sellerId);
    } else if (!isSuperAdmin(scope)) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فروشنده برای ثبت قرارداد الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userIds = [...new Set(dto.userIds)];
    await this.ensureUsersBelongToSeller(scope, userIds, sellerId);

    const contract = await this.contractRepository.save(
      this.contractRepository.create({
        sellerId,
        sellerName: dto.sellerName,
        userIds,
        contractPartyName: dto.contractPartyName,
        description: dto.description ?? null,
        contractDate: new Date(dto.contractDate),
      }),
    );

    return toSellerContractResponse(contract);
  }

  async update(scope: TenantScope, id: string, dto: UpdateSellerContractDto) {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new ApiException(
        'CONTRACT_NOT_FOUND',
        'قرارداد یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerAccessible(scope, contract.sellerId);

    if (dto.userIds) {
      const userIds = [...new Set(dto.userIds)];
      await this.ensureUsersBelongToSeller(
        scope,
        userIds,
        contract.sellerId,
      );
      contract.userIds = userIds;
    }

    if (dto.sellerName !== undefined) contract.sellerName = dto.sellerName;
    if (dto.contractPartyName !== undefined) {
      contract.contractPartyName = dto.contractPartyName;
    }
    if (dto.description !== undefined) contract.description = dto.description;
    if (dto.contractDate !== undefined) {
      contract.contractDate = new Date(dto.contractDate);
    }

    const updated = await this.contractRepository.save(contract);
    return toSellerContractResponse(updated);
  }

  async remove(scope: TenantScope, id: string) {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new ApiException(
        'CONTRACT_NOT_FOUND',
        'قرارداد یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerAccessible(scope, contract.sellerId);
    await this.contractRepository.remove(contract);
    return {};
  }

  private async resolveSellerId(
    sellerId?: string,
  ): Promise<string | null> {
    if (!sellerId) {
      return null;
    }

    const seller = await this.sellerRepository.findById(sellerId);
    return seller?.id ?? null;
  }

  private async ensureUsersBelongToSeller(
    scope: TenantScope,
    userIds: string[],
    sellerId: string | null,
  ) {
    const users = await this.userRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      const foundIds = new Set(users.map((user) => user.id));
      const missing = userIds.filter((id) => !foundIds.has(id));
      throw new ApiException(
        'USER_NOT_FOUND',
        `کاربر یافت نشد: ${missing.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isSuperAdmin(scope)) {
      return;
    }

    for (const user of users) {
      if (!sellerId || user.sellerId !== sellerId) {
        throw new ApiException(
          'FORBIDDEN',
          'کاربر انتخاب‌شده متعلق به این فروشنده نیست',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private assertSellerAccessible(
    scope: TenantScope,
    sellerId: string | null | undefined,
  ) {
    if (!sellerId) {
      if (!isSuperAdmin(scope)) {
        throw new ApiException(
          'FORBIDDEN',
          'دسترسی به قرارداد این فروشنده مجاز نیست',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }

    if (!canAccessSellerData(scope, sellerId)) {
      throw new ApiException(
        'FORBIDDEN',
        'دسترسی به قرارداد این فروشنده مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
