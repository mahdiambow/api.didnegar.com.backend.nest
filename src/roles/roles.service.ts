import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  ALL_PERMISSIONS,
  PERMISSION_DEFINITIONS,
} from './permissions.js';
import { Role } from './entities/role.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { toRoleResponse } from './dto/role-response.dto.js';
import { getPaginationParams, paginatedList } from '../common/response/helpers/paginated-response.helper.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  getPermissions() {
    return {
      permissions: PERMISSION_DEFINITIONS,
      all: ALL_PERMISSIONS,
    };
  }

  async findAll(query: { page?: string | number; limit?: string | number }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.roleRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return paginatedList(
      items.map(toRoleResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toRoleResponse(role);
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.roleRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ApiException(
        'ROLE_ALREADY_EXISTS',
        'نقش با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    this.assertValidPermissions(dto.permissions);

    const role = await this.roleRepo.save(
      this.roleRepo.create({
        slug: dto.slug,
        name: dto.name,
        permissions: dto.permissions,
        isSystem: false,
      }),
    );

    return toRoleResponse(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (role.isSystem && dto.slug && dto.slug !== role.slug) {
      throw new ApiException(
        'SYSTEM_ROLE_PROTECTED',
        'slug نقش سیستمی قابل تغییر نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.slug && dto.slug !== role.slug) {
      const slugTaken = await this.roleRepo.findOne({
        where: { slug: dto.slug },
      });
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
    const updated = await this.roleRepo.save(role);
    return toRoleResponse(updated);
  }

  async remove(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (role.isSystem) {
      throw new ApiException(
        'SYSTEM_ROLE_PROTECTED',
        'نقش سیستمی قابل حذف نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    const usersCount = await this.roleRepo.manager
      .createQueryBuilder()
      .from('users', 'user')
      .where('user.roleId = :roleId', { roleId: id })
      .getCount();

    if (usersCount > 0) {
      throw new ApiException(
        'ROLE_IN_USE',
        'این نقش به کاربران اختصاص داده شده و قابل حذف نیست',
        HttpStatus.CONFLICT,
      );
    }

    await this.roleRepo.remove(role);
    return {};
  }

  private assertValidPermissions(permissions: string[]) {
    const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalid.length) {
      throw new ApiException(
        'INVALID_PERMISSIONS',
        `دسترسی‌های نامعتبر: ${invalid.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
