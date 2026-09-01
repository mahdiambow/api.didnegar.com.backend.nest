import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { canAccessSellerData } from '../common/tenant/tenant-access.js';
import { isSuperAdmin } from '../common/tenant/tenant-scope.js';
import type { TenantScope } from '../common/tenant/tenant-scope.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { UserRepository } from '../auth/repositories/user.repository.js';
import { RoleRepository } from '../roles/repositories/role.repository.js';
import { DEFAULT_ROLE_SLUGS, isSuperAdminRole } from '../roles/permissions.js';
import { BusinessType, SellerStatus } from './entities/seller.enums.js';
import { DEFAULT_SELLER_SETTINGS } from './types/seller-settings.type.js';
import { SellerRepository } from './repositories/seller.repository.js';
import { SellerContractRepository } from './repositories/seller-contract.repository.js';
import { CreateSellerDto } from './dto/create-seller.dto.js';
import { UpdateSellerDto } from './dto/update-seller.dto.js';
import { toSellerResponse } from './dto/seller-response.dto.js';

@Injectable()
export class SellersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sellerRepository: SellerRepository,
    private readonly contractRepository: SellerContractRepository,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async findAll(
    scope: TenantScope,
    query: { page?: string | number; limit?: string | number },
  ) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.sellerRepository.findPaginatedForTenant(
      offset,
      limit,
      {
        sellerId: scope.sellerId,
        isSuperAdmin: isSuperAdmin(scope),
      },
    );

    const data = await Promise.all(
      items.map((seller) => this.buildSellerResponse(seller)),
    );

    return paginatedList(data, page, limit, total);
  }

  async findOne(scope: TenantScope, id: string) {
    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerAccessible(scope, seller.id);
    return this.buildSellerResponse(seller);
  }

  async create(scope: TenantScope, dto: CreateSellerDto) {
    if (!isSuperAdmin(scope)) {
      throw new ApiException(
        'FORBIDDEN',
        'فقط super-admin می‌تواند فروشنده ایجاد کند',
        HttpStatus.FORBIDDEN,
      );
    }

    const existing = await this.sellerRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ApiException(
        'SELLER_ALREADY_EXISTS',
        'فروشنده با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const adminIds = [...new Set(dto.admins ?? [])];
    const contractAdminId = dto.contract?.adminId ?? adminIds[0];

    if (dto.contract && !contractAdminId) {
      throw new ApiException(
        'CONTRACT_ADMIN_REQUIRED',
        'برای ثبت قرارداد باید adminId یا admins ارسال شود',
        HttpStatus.BAD_REQUEST,
      );
    }

    const assignAdminIds = [...new Set(adminIds)];
    if (contractAdminId && !assignAdminIds.includes(contractAdminId)) {
      assignAdminIds.push(contractAdminId);
    }

    if (
      dto.contract?.adminId &&
      adminIds.length > 0 &&
      !adminIds.includes(dto.contract.adminId)
    ) {
      throw new ApiException(
        'CONTRACT_ADMIN_MISMATCH',
        'adminId قرارداد باید در لیست admins باشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const adminRole = await this.roleRepository.findBySlug(
      DEFAULT_ROLE_SLUGS.ADMIN,
      null,
    );
    if (!adminRole) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش admin یافت نشد',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.validateAdminUsers(assignAdminIds);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const seller = await qr.manager.save(
        this.sellerRepository.create({
          name: dto.name,
          slug: dto.slug,
          businessName: dto.businessName,
          businessType: dto.businessType ?? BusinessType.OTHER,
          email: dto.email,
          phone: dto.phone,
          nationalId: dto.nationalId ?? null,
          registrationNumber: dto.registrationNumber ?? null,
          address: dto.address ?? null,
          city: dto.city ?? null,
          postalCode: dto.postalCode ?? null,
          status: dto.status ?? SellerStatus.ACTIVE,
          settings: { ...DEFAULT_SELLER_SETTINGS },
        }),
      );

      for (const adminId of assignAdminIds) {
        await qr.manager.update('users', adminId, {
          sellerId: seller.id,
          roleId: adminRole.id,
        });
      }

      let contractId: string | null = null;
      if (dto.contract) {
        const contract = await qr.manager.save(
          this.contractRepository.create({
            sellerId: seller.id,
            sellerName: seller.name,
            adminId: contractAdminId!,
            contractPartyName: dto.contract.contractPartyName,
            description: dto.contract.description ?? null,
            contractDate: new Date(dto.contract.contractDate),
          }),
        );
        contractId = contract.id;
      }

      await qr.commitTransaction();

      return toSellerResponse(seller, {
        contractId,
        adminIds: assignAdminIds,
      });
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async update(scope: TenantScope, id: string, dto: UpdateSellerDto) {
    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerAccessible(scope, seller.id);

    if (dto.slug && dto.slug !== seller.slug) {
      const slugTaken = await this.sellerRepository.findBySlug(dto.slug);
      if (slugTaken) {
        throw new ApiException(
          'SELLER_ALREADY_EXISTS',
          'فروشنده با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    const { contract: _contract, admins: _admins, ...sellerFields } = dto;
    Object.assign(seller, sellerFields);
    const updated = await this.sellerRepository.save(seller);
    return this.buildSellerResponse(updated);
  }

  async remove(scope: TenantScope, id: string) {
    if (!isSuperAdmin(scope)) {
      throw new ApiException(
        'FORBIDDEN',
        'فقط super-admin می‌تواند فروشنده حذف کند',
        HttpStatus.FORBIDDEN,
      );
    }

    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.sellerRepository.remove(seller);
    return {};
  }

  private async buildSellerResponse(seller: Awaited<
    ReturnType<SellerRepository['findById']>
  >) {
    if (!seller) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const [contract, adminIds] = await Promise.all([
      this.contractRepository.findLatestBySellerId(seller.id),
      this.userRepository.findAdminIdsBySellerId(seller.id),
    ]);

    return toSellerResponse(seller, {
      contractId: contract?.id ?? null,
      adminIds,
    });
  }

  private async validateAdminUsers(adminIds: string[]) {
    if (adminIds.length === 0) {
      return;
    }

    const users = await this.userRepository.findByIds(adminIds);
    if (users.length !== adminIds.length) {
      throw new ApiException(
        'ADMIN_NOT_FOUND',
        'یک یا چند ادمین یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const user of users) {
      if (isSuperAdminRole(user.role.slug)) {
        throw new ApiException(
          'FORBIDDEN',
          'super-admin را نمی‌توان به فروشنده اختصاص داد',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.sellerId) {
        throw new ApiException(
          'ADMIN_ALREADY_ASSIGNED',
          `کاربر ${user.username} قبلاً به فروشنده دیگری اختصاص داده شده`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private assertSellerAccessible(scope: TenantScope, sellerId: string) {
    if (!canAccessSellerData(scope, sellerId)) {
      throw new ApiException(
        'FORBIDDEN',
        'دسترسی به این فروشنده مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
