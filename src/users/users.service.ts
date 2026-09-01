import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ApiException } from '../common/exceptions/api.exception.js';
import { canAccessSellerData } from '../common/tenant/tenant-access.js';
import { isSuperAdmin } from '../common/tenant/tenant-scope.js';
import type { TenantScope } from '../common/tenant/tenant-scope.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { toUserResponse } from '../auth/dto/user-response.dto.js';
import { UserRepository } from '../auth/repositories/user.repository.js';
import { RoleRepository } from '../roles/repositories/role.repository.js';
import { SellerRepository } from '../sellers/repositories/seller.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly sellerRepository: SellerRepository,
  ) {}

  async findAll(
    scope: TenantScope,
    query: { page?: string | number; limit?: string | number },
  ) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.userRepository.findPaginatedForTenant(
      offset,
      limit,
      {
        sellerId: scope.sellerId,
        isSuperAdmin: isSuperAdmin(scope),
      },
    );

    return paginatedList(
      items.map(toUserResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(scope: TenantScope, id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertUserAccessible(scope, user.sellerId);
    return toUserResponse(user);
  }

  async create(scope: TenantScope, dto: CreateUserDto) {
    const existing = await this.userRepository.findByUsername(dto.username);
    if (existing) {
      throw new ApiException(
        'USER_ALREADY_EXISTS',
        'کاربر با این شماره موبایل از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sellerId = await this.resolveSellerId(scope, dto.sellerId, role.sellerId);

    const saved = await this.userRepository.save(
      this.userRepository.create({
        username: dto.username,
        roleId: dto.roleId,
        sellerId,
        email: dto.email ?? null,
        displayName: dto.displayName ?? null,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        isActive: dto.isActive ?? true,
        password: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : null,
      }),
    );

    const loaded = await this.userRepository.findByIdOrFail(saved.id);
    return toUserResponse(loaded);
  }

  async update(scope: TenantScope, id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertUserAccessible(scope, user.sellerId);

    if (dto.roleId) {
      const role = await this.roleRepository.findById(dto.roleId);
      if (!role) {
        throw new ApiException(
          'ROLE_NOT_FOUND',
          'نقش یافت نشد',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        !isSuperAdmin(scope) &&
        role.sellerId &&
        role.sellerId !== scope.sellerId
      ) {
        throw new ApiException(
          'FORBIDDEN',
          'امکان اختصاص این نقش وجود ندارد',
          HttpStatus.FORBIDDEN,
        );
      }

      user.roleId = dto.roleId;
    }

    if (dto.email !== undefined) user.email = dto.email;
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.website !== undefined) user.website = dto.website;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepository.save(user);
    const loaded = await this.userRepository.findByIdOrFail(id);
    return toUserResponse(loaded);
  }

  async remove(scope: TenantScope, id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertUserAccessible(scope, user.sellerId);
    await this.userRepository.remove(user);
    return {};
  }

  private async resolveSellerId(
    scope: TenantScope,
    requestedSellerId: string | undefined,
    roleSellerId: string | null,
  ): Promise<string | null> {
    if (isSuperAdmin(scope)) {
      const sellerId = requestedSellerId ?? roleSellerId ?? null;
      if (sellerId) {
        await this.ensureSellerExists(sellerId);
      }
      return sellerId;
    }

    if (!scope.sellerId) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فقط کاربران فروشنده می‌توانند ادمین تعریف کنند',
        HttpStatus.FORBIDDEN,
      );
    }

    if (requestedSellerId && requestedSellerId !== scope.sellerId) {
      throw new ApiException(
        'FORBIDDEN',
        'امکان ساخت کاربر برای فروشنده دیگر وجود ندارد',
        HttpStatus.FORBIDDEN,
      );
    }

    if (roleSellerId && roleSellerId !== scope.sellerId) {
      throw new ApiException(
        'FORBIDDEN',
        'نقش انتخاب‌شده متعلق به فروشنده دیگری است',
        HttpStatus.FORBIDDEN,
      );
    }

    return scope.sellerId;
  }

  private async ensureSellerExists(sellerId: string) {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new ApiException(
        'SELLER_NOT_FOUND',
        'فروشنده یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertUserAccessible(
    scope: TenantScope,
    userSellerId: string | null,
  ) {
    if (isSuperAdmin(scope)) {
      return;
    }

    if (!canAccessSellerData(scope, userSellerId)) {
      throw new ApiException(
        'FORBIDDEN',
        'دسترسی به این کاربر مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
