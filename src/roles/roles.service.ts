import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { canAccessSellerData } from '../common/tenant/tenant-access.js';
import { isSuperAdmin } from '../common/tenant/tenant-scope.js';
import type { TenantScope } from '../common/tenant/tenant-scope.js';
import {
  ALL_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  isValidPermission,
} from './permissions.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { toRoleResponse } from './dto/role-response.dto.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { RoleRepository } from './repositories/role.repository.js';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  getPermissions() {
    return {
      permissions: PERMISSION_DEFINITIONS,
      all: ALL_PERMISSIONS,
    };
  }

  async findAll(
    scope: TenantScope,
    query: { page?: string | number; limit?: string | number },
  ) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.roleRepository.findPaginatedForTenant(
      offset,
      limit,
      {
        sellerId: scope.sellerId,
        isSuperAdmin: isSuperAdmin(scope),
      },
    );

    return paginatedList(
      items.map(toRoleResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(scope: TenantScope, id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertRoleAccessible(scope, role.sellerId);
    return toRoleResponse(role);
  }

  async create(scope: TenantScope, dto: CreateRoleDto) {
    const sellerId = this.resolveSellerId(scope, dto.sellerId);
    const existing = await this.roleRepository.findBySlug(dto.slug, sellerId);
    if (existing) {
      throw new ApiException(
        'ROLE_ALREADY_EXISTS',
        'نقش با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    this.assertValidPermissions(dto.permissions);

    const role = await this.roleRepository.save(
      this.roleRepository.create({
        slug: dto.slug,
        name: dto.name,
        permissions: dto.permissions,
        isSystem: false,
        sellerId,
      }),
    );

    return toRoleResponse(role);
  }

  async update(scope: TenantScope, id: string, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertRoleAccessible(scope, role.sellerId);

    if (role.isSystem) {
      throw new ApiException(
        'SYSTEM_ROLE_PROTECTED',
        'نقش سیستمی قابل ویرایش نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.slug && dto.slug !== role.slug) {
      const slugTaken = await this.roleRepository.findBySlug(
        dto.slug,
        role.sellerId,
      );
      if (slugTaken) {
        throw new ApiException(
          'ROLE_ALREADY_EXISTS',
          'نقش با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (dto.permissions) {
      this.assertValidPermissions(dto.permissions);
    }

    Object.assign(role, dto);
    const updated = await this.roleRepository.save(role);
    return toRoleResponse(updated);
  }

  async remove(scope: TenantScope, id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertRoleAccessible(scope, role.sellerId);

    if (role.isSystem) {
      throw new ApiException(
        'SYSTEM_ROLE_PROTECTED',
        'نقش سیستمی قابل حذف نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    const usersCount = await this.roleRepository.countUsersByRoleId(id);

    if (usersCount > 0) {
      throw new ApiException(
        'ROLE_IN_USE',
        'این نقش به کاربران اختصاص داده شده و قابل حذف نیست',
        HttpStatus.CONFLICT,
      );
    }

    await this.roleRepository.remove(role);
    return {};
  }

  private resolveSellerId(
    scope: TenantScope,
    requestedSellerId?: string | null,
  ): string | null {
    if (isSuperAdmin(scope)) {
      return requestedSellerId ?? null;
    }

    if (!scope.sellerId) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فقط کاربران فروشنده می‌توانند نقش سفارشی بسازند',
        HttpStatus.FORBIDDEN,
      );
    }

    if (requestedSellerId && requestedSellerId !== scope.sellerId) {
      throw new ApiException(
        'FORBIDDEN',
        'امکان ساخت نقش برای فروشنده دیگر وجود ندارد',
        HttpStatus.FORBIDDEN,
      );
    }

    return scope.sellerId;
  }

  private assertRoleAccessible(
    scope: TenantScope,
    roleSellerId: string | null,
  ) {
    if (isSuperAdmin(scope)) {
      return;
    }

    if (roleSellerId === null) {
      return;
    }

    if (!canAccessSellerData(scope, roleSellerId)) {
      throw new ApiException(
        'FORBIDDEN',
        'دسترسی به این نقش مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertValidPermissions(permissions: string[]) {
    const invalid = permissions.filter((p) => !isValidPermission(p));
    if (invalid.length) {
      throw new ApiException(
        'INVALID_PERMISSIONS',
        `دسترسی‌های نامعتبر: ${invalid.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
