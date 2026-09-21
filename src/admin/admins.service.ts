import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { isSuperAdmin } from '../common/tenant/tenant-scope.js';
import type { TenantScope } from '../common/tenant/tenant-scope.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { UserRepository } from '../utils/auth/repositories/user.repository.js';
import { toUserResponse } from '../utils/auth/dto/user-response.dto.js';
import { RoleRepository } from '../roles/repositories/role.repository.js';
import { RoleAudience } from '../roles/role-audience.enum.js';
import { hasAudience } from '../roles/role-audience.util.js';
import { AdminRepository } from './repositories/admin.repository.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';
import { toAdminResponse } from './dto/admin-response.dto.js';

@Injectable()
export class AdminsService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async findAll(
    scope: TenantScope,
    query: { page?: string | number; limit?: string | number; search?: string },
  ) {
    this.assertCanManage(scope);
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.adminRepository.findPaginated(
      offset,
      limit,
      query.search,
    );
    const data = await Promise.all(
      items.map((admin) => this.buildResponse(admin, 'list')),
    );
    return paginatedList(data, page, limit, total);
  }

  async findOne(scope: TenantScope, id: string) {
    this.assertCanManage(scope);
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new ApiException(
        'ADMIN_NOT_FOUND',
        'ادمین یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.buildResponse(admin, 'detail');
  }

  async create(scope: TenantScope, dto: CreateAdminDto) {
    this.assertCanManage(scope);

    const phoneTaken = await this.adminRepository.findByPhone(dto.phone);
    if (phoneTaken) {
      throw new ApiException(
        'ADMIN_PHONE_EXISTS',
        'ادمین با این شماره موبایل از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    if (dto.email) {
      const emailTaken = await this.adminRepository.findByEmail(dto.email);
      if (emailTaken) {
        throw new ApiException(
          'ADMIN_EMAIL_EXISTS',
          'ادمین با این ایمیل از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    const userIds = [...new Set(dto.userIds ?? [])];
    await this.assertAdminAudienceUsers(userIds);

    const saved = await this.adminRepository.save(
      this.adminRepository.create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        isActive: dto.isActive ?? true,
      }),
    );

    if (userIds.length) {
      await this.userRepository.setUsersAdminId(userIds, saved.id);
    }

    return this.buildResponse(saved);
  }

  async update(scope: TenantScope, id: string, dto: UpdateAdminDto) {
    this.assertCanManage(scope);
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new ApiException(
        'ADMIN_NOT_FOUND',
        'ادمین یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.phone && dto.phone !== admin.phone) {
      const phoneTaken = await this.adminRepository.findByPhone(dto.phone);
      if (phoneTaken) {
        throw new ApiException(
          'ADMIN_PHONE_EXISTS',
          'ادمین با این شماره موبایل از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
      admin.phone = dto.phone;
    }

    if (dto.email !== undefined && dto.email !== admin.email) {
      if (dto.email) {
        const emailTaken = await this.adminRepository.findByEmail(dto.email);
        if (emailTaken) {
          throw new ApiException(
            'ADMIN_EMAIL_EXISTS',
            'ادمین با این ایمیل از قبل وجود دارد',
            HttpStatus.CONFLICT,
          );
        }
      }
      admin.email = dto.email ?? null;
    }

    if (dto.name !== undefined) admin.name = dto.name;
    if (dto.isActive !== undefined) admin.isActive = dto.isActive;

    const saved = await this.adminRepository.save(admin);

    if (dto.userIds !== undefined) {
      const userIds = [...new Set(dto.userIds)];
      await this.assertAdminAudienceUsers(userIds);
      await this.userRepository.clearAdminId(saved.id);
      if (userIds.length) {
        await this.userRepository.setUsersAdminId(userIds, saved.id);
      }
    }

    return this.buildResponse(saved);
  }

  async remove(scope: TenantScope, id: string) {
    this.assertCanManage(scope);
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new ApiException(
        'ADMIN_NOT_FOUND',
        'ادمین یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepository.clearAdminId(admin.id);
    await this.adminRepository.remove(admin);
    return {};
  }

  private async buildResponse(
    admin: NonNullable<Awaited<ReturnType<AdminRepository['findById']>>>,
    mode: 'list' | 'detail' = 'detail',
  ) {
    if (mode === 'list') {
      const userIds = await this.userRepository.findUserIdsByAdminId(admin.id);
      return toAdminResponse(admin, {
        userIds,
        users: undefined,
      });
    }

    const users = await this.userRepository.findUsersByAdminId(admin.id);
    const mapped = await Promise.all(
      users.map(async (user) => {
        const extraRoles = await this.roleRepository.findByIds(
          user.extraRoleIds ?? [],
        );
        return toUserResponse(user, extraRoles);
      }),
    );

    return toAdminResponse(admin, {
      userIds: mapped.map((user) => user.id),
      users: mapped,
    });
  }

  private async assertAdminAudienceUsers(userIds: string[]) {
    if (!userIds.length) return;

    const users = await this.userRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'یک یا چند کاربر یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const user of users) {
      const extraRoles = await this.roleRepository.findByIds(
        user.extraRoleIds ?? [],
      );
      const audiences = [
        user.role.audience,
        ...extraRoles.map((role) => role.audience),
      ];
      if (!hasAudience(audiences, RoleAudience.ADMIN)) {
        throw new ApiException(
          'ROLE_AUDIENCE_MISMATCH',
          `کاربر ${user.username} هیچ نقش حوزه admin ندارد و قابل لینک به ادمین نیست`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private assertCanManage(scope: TenantScope) {
    if (!isSuperAdmin(scope)) {
      throw new ApiException(
        'FORBIDDEN',
        'فقط super-admin می‌تواند ادمین‌ها را مدیریت کند',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
