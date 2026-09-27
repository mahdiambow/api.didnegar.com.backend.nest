import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ApiException } from '../common/exceptions/api.exception.js';
import { newId } from '../common/id/index.js';
import { canAccessSellerData } from '../common/tenant/tenant-access.js';
import { isSuperAdmin } from '../common/tenant/tenant-scope.js';
import type { TenantScope } from '../common/tenant/tenant-scope.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { toUserResponse } from '../utils/auth/dto/user-response.dto.js';
import { UserRepository } from '../utils/auth/repositories/user.repository.js';
import { RoleRepository } from '../roles/repositories/role.repository.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { SellerRepository } from '../sellers/repositories/seller.repository.js';
import { BusinessType, SellerStatus } from '../sellers/entities/seller.enums.js';
import { DEFAULT_SELLER_SETTINGS } from '../sellers/types/seller-settings.type.js';
import { AdminRepository } from '../admin/repositories/admin.repository.js';
import type { Role } from '../roles/entities/role.entity.js';
import { toRoleResponse } from '../roles/dto/role-response.dto.js';
import { assertCompatibleRoleAudiences } from '../roles/role-audience.util.js';
import { resolveUserRoles } from '../utils/auth/types/auth-user.type.js';
import { CreditService } from '../credit/credit.service.js';
import type { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto.js';
import { RevokeUserRolesDto } from './dto/revoke-user-roles.dto.js';
import type { UserRolesResponseDto } from './dto/user-roles-response.dto.js';

const SELLER_ROLE_SLUGS = new Set<string>([
  DEFAULT_ROLE_SLUGS.SELLER,
  DEFAULT_ROLE_SLUGS.SUPER_SELLER,
]);
const ADMIN_ROLE_SLUGS = new Set<string>([
  DEFAULT_ROLE_SLUGS.ADMIN,
  DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
]);

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly sellerRepository: SellerRepository,
    private readonly adminRepository: AdminRepository,
    private readonly creditService: CreditService,
  ) {}

  async findAll(
    scope: TenantScope,
    query: {
      page?: string | number;
      limit?: string | number;
      search?: string;
    },
  ) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.userRepository.findPaginatedForTenant(
      offset,
      limit,
      {
        sellerId: scope.sellerId,
        isSuperAdmin: isSuperAdmin(scope),
        search: query.search,
      },
    );

    return paginatedList(
      await Promise.all(items.map((item) => this.toResponse(item))),
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
    return this.toResponse(user);
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

    const { primaryRole, extraRoleIds } = await this.resolveRoleIds(
      scope,
      dto.roleIds,
    );
    const sellerId = await this.resolveSellerId(
      scope,
      dto.sellerId,
      primaryRole.sellerId,
    );

    const saved = await this.userRepository.save(
      this.userRepository.create({
        username: dto.username,
        role: primaryRole,
        roleId: primaryRole.id,
        extraRoleIds,
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
    await this.creditService.init(saved.id);

    const loaded = await this.userRepository.findById(saved.id);
    return this.toResponse(loaded!);
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

    if (dto.roleIds) {
      const { primaryRole, extraRoleIds } = await this.resolveRoleIds(
        scope,
        dto.roleIds,
      );
      user.roleId = primaryRole.id;
      user.extraRoleIds = extraRoleIds;
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
    return this.toResponse(loaded);
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

  async getRoles(scope: TenantScope, id: string): Promise<UserRolesResponseDto> {
    const user = await this.requireAccessibleUser(scope, id);
    return this.toRolesResponse(user);
  }

  async assignRoles(
    scope: TenantScope,
    id: string,
    dto: AssignUserRolesDto,
  ): Promise<UserRolesResponseDto> {
    const user = await this.requireAccessibleUser(scope, id);
    const rolesToAdd = await this.loadAssignableRoles(scope, dto.roleIds);

    const currentExtra = await this.roleRepository.findByIds(
      user.extraRoleIds ?? [],
    );
    const currentById = new Map<string, Role>([
      [user.role.id, user.role],
      ...currentExtra.map((role) => [role.id, role] as const),
    ]);

    for (const role of rolesToAdd) {
      currentById.set(role.id, role);
    }

    let primaryRole = user.role;
    if (dto.makePrimary) {
      primaryRole = rolesToAdd[0]!;
    } else if (!currentById.has(user.role.id)) {
      primaryRole = rolesToAdd[0]!;
    } else {
      primaryRole = currentById.get(user.role.id)!;
    }

    const extraRoles = [...currentById.values()].filter(
      (role) => role.id !== primaryRole.id,
    );
    assertCompatibleRoleAudiences([primaryRole, ...extraRoles]);

    user.roleId = primaryRole.id;
    user.role = primaryRole;
    user.extraRoleIds = extraRoles.map((role) => role.id);

    await this.syncPortalLinks(user, [primaryRole, ...extraRoles], dto.sellerId);
    await this.userRepository.save(user);

    const loaded = await this.userRepository.findByIdOrFail(id);
    return this.toRolesResponse(loaded);
  }

  async revokeRoles(
    scope: TenantScope,
    id: string,
    dto: RevokeUserRolesDto,
  ): Promise<UserRolesResponseDto> {
    const user = await this.requireAccessibleUser(scope, id);
    const revokeIds = new Set(dto.roleIds);

    const currentExtra = await this.roleRepository.findByIds(
      user.extraRoleIds ?? [],
    );
    const remaining = [user.role, ...currentExtra].filter(
      (role) => !revokeIds.has(role.id),
    );

    if (!remaining.length) {
      throw new ApiException(
        'ROLE_REQUIRED',
        'کاربر باید حداقل یک نقش داشته باشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    let primaryRole = remaining.find((role) => role.id === user.role.id);
    if (!primaryRole) {
      if (!dto.newPrimaryRoleId) {
        throw new ApiException(
          'PRIMARY_ROLE_REQUIRED',
          'برای حذف نقش اصلی، newPrimaryRoleId را مشخص کنید',
          HttpStatus.BAD_REQUEST,
        );
      }
      primaryRole = remaining.find((role) => role.id === dto.newPrimaryRoleId);
      if (!primaryRole) {
        throw new ApiException(
          'PRIMARY_ROLE_INVALID',
          'نقش اصلی جدید باید یکی از نقش‌های باقی‌مانده باشد',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const extraRoles = remaining.filter((role) => role.id !== primaryRole.id);
    assertCompatibleRoleAudiences([primaryRole, ...extraRoles]);

    user.roleId = primaryRole.id;
    user.role = primaryRole;
    user.extraRoleIds = extraRoles.map((role) => role.id);

    await this.syncPortalLinks(user, [primaryRole, ...extraRoles]);
    await this.userRepository.save(user);

    const loaded = await this.userRepository.findByIdOrFail(id);
    return this.toRolesResponse(loaded);
  }

  private async requireAccessibleUser(scope: TenantScope, id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    this.assertUserAccessible(scope, user.sellerId);
    return user;
  }

  private async loadAssignableRoles(scope: TenantScope, roleIds: string[]) {
    const uniqueIds = [...new Set(roleIds)];
    const roles = await this.roleRepository.findByIds(uniqueIds);
    const roleMap = new Map(roles.map((role) => [role.id, role]));
    const missing = uniqueIds.filter((id) => !roleMap.has(id));
    if (missing.length) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        `نقش یافت نشد: ${missing.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ordered = uniqueIds.map((id) => roleMap.get(id)!);
    for (const role of ordered) {
      this.assertRoleAssignable(scope, role);
    }
    return ordered;
  }

  private async toRolesResponse(user: User): Promise<UserRolesResponseDto> {
    const extraRoles = await this.roleRepository.findByIds(
      user.extraRoleIds ?? [],
    );
    const orderedExtra = (user.extraRoleIds ?? [])
      .map((id) => extraRoles.find((role) => role.id === id))
      .filter((role): role is Role => Boolean(role));

    return {
      userId: user.id,
      username: user.username,
      primaryRole: toRoleResponse(user.role),
      extraRoles: orderedExtra.map(toRoleResponse),
      roleIds: [user.role.id, ...orderedExtra.map((role) => role.id)],
      roles: resolveUserRoles(
        user.role.slug,
        orderedExtra.map((role) => role.slug),
      ),
      sellerId: user.sellerId,
      adminId: user.adminId,
    };
  }

  private async syncPortalLinks(
    user: User,
    roles: Role[],
    requestedSellerId?: string,
  ) {
    const slugs = new Set(roles.map((role) => role.slug));
    const needsSeller = [...slugs].some((slug) => SELLER_ROLE_SLUGS.has(slug));
    const needsAdmin = [...slugs].some((slug) => ADMIN_ROLE_SLUGS.has(slug));

    if (needsSeller) {
      if (!user.sellerId) {
        user.sellerId = await this.ensureSellerLink(user, requestedSellerId);
      } else if (requestedSellerId && requestedSellerId !== user.sellerId) {
        await this.ensureSellerExists(requestedSellerId);
        user.sellerId = requestedSellerId;
      }
    } else {
      user.sellerId = null;
    }

    if (needsAdmin) {
      if (!user.adminId) {
        user.adminId = await this.ensureAdminLink(user);
      }
    } else {
      user.adminId = null;
    }
  }

  private async ensureSellerLink(user: User, requestedSellerId?: string) {
    if (requestedSellerId) {
      await this.ensureSellerExists(requestedSellerId);
      return requestedSellerId;
    }

    const byPhone = await this.sellerRepository.findByPhone(user.username);
    if (byPhone) return byPhone.id;

    const slugBase = `shop-${user.username.slice(-4)}`;
    let slug = slugBase;
    if (await this.sellerRepository.findBySlug(slug)) {
      slug = `${slugBase}-${Date.now().toString(36)}`;
    }

    const saved = await this.sellerRepository.save(
      this.sellerRepository.create({
        id: newId(),
        name: user.displayName || `Shop ${user.username}`,
        slug,
        businessName: user.displayName || `Shop ${user.username}`,
        businessType: BusinessType.OTHER,
        email: `${user.username}@seller.local`,
        phone: user.username,
        status: SellerStatus.ACTIVE,
        settings: { ...DEFAULT_SELLER_SETTINGS },
      }),
    );
    return saved.id;
  }

  private async ensureAdminLink(user: User) {
    const byPhone = await this.adminRepository.findByPhone(user.username);
    if (byPhone) {
      if (!byPhone.isActive) {
        byPhone.isActive = true;
        await this.adminRepository.save(byPhone);
      }
      return byPhone.id;
    }

    const saved = await this.adminRepository.save(
      this.adminRepository.create({
        id: newId(),
        name: user.displayName || user.username,
        phone: user.username,
        email: null,
        isActive: true,
      }),
    );
    return saved.id;
  }

  private async resolveRoleIds(scope: TenantScope, roleIds: string[]) {
    const uniqueIds = [...new Set(roleIds)];
    const roles = await this.roleRepository.findByIds(uniqueIds);
    const roleMap = new Map(roles.map((role) => [role.id, role]));

    const missing = uniqueIds.filter((id) => !roleMap.has(id));
    if (missing.length) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        `نقش یافت نشد: ${missing.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const ordered = uniqueIds.map((id) => roleMap.get(id)!);
    for (const role of ordered) {
      this.assertRoleAssignable(scope, role);
    }
    assertCompatibleRoleAudiences(ordered);

    const [primaryRole, ...extraRoles] = ordered;
    return {
      primaryRole,
      extraRoleIds: extraRoles.map((role) => role.id),
    };
  }

  private async toResponse(user: {
    extraRoleIds?: string[] | null;
  } & Parameters<typeof toUserResponse>[0]) {
    const extraRoles = await this.roleRepository.findByIds(
      user.extraRoleIds ?? [],
    );
    return toUserResponse(user, extraRoles);
  }

  private assertRoleAssignable(scope: TenantScope, role: Role) {
    if (isSuperAdmin(scope)) return;

    if (role.sellerId && role.sellerId !== scope.sellerId) {
      throw new ApiException(
        'FORBIDDEN',
        'امکان اختصاص این نقش وجود ندارد',
        HttpStatus.FORBIDDEN,
      );
    }
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
