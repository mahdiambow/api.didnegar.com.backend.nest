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
    this.assertSellerAccessible(scope, dto.sellerId);

    const seller = await this.sellerRepository.findById(dto.sellerId);
    if (!seller) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.ensureAdminBelongsToSeller(scope, dto.adminId, dto.sellerId);

    const contract = await this.contractRepository.save(
      this.contractRepository.create({
        sellerId: dto.sellerId,
        sellerName: dto.sellerName,
        adminId: dto.adminId,
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

    if (dto.adminId) {
      await this.ensureAdminBelongsToSeller(
        scope,
        dto.adminId,
        contract.sellerId,
      );
      contract.adminId = dto.adminId;
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

  private async ensureAdminBelongsToSeller(
    scope: TenantScope,
    adminId: string,
    sellerId: string,
  ) {
    const admin = await this.userRepository.findById(adminId);
    if (!admin) {
      throw new ApiException(
        'ADMIN_NOT_FOUND',
        'ادمین یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isSuperAdmin(scope)) {
      return;
    }

    if (admin.sellerId !== sellerId) {
      throw new ApiException(
        'FORBIDDEN',
        'ادمین انتخاب‌شده متعلق به این فروشنده نیست',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertSellerAccessible(scope: TenantScope, sellerId: string) {
    if (!canAccessSellerData(scope, sellerId)) {
      throw new ApiException(
        'FORBIDDEN',
        'دسترسی به قرارداد این فروشنده مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
