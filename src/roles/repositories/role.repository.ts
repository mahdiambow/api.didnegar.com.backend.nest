import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DEFAULT_ROLE_SLUGS } from '../permissions.js';
import { Role } from '../entities/role.entity.js';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role) private readonly repo: Repository<Role>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string, sellerId: string | null = null) {
    return this.repo.findOne({
      where: {
        slug,
        sellerId: sellerId === null ? IsNull() : sellerId,
      },
    });
  }

  findPaginatedForTenant(
    offset: number,
    limit: number,
    options: { sellerId: string | null; isSuperAdmin: boolean },
  ) {
    const qb = this.repo
      .createQueryBuilder('role')
      .orderBy('role.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (!options.isSuperAdmin) {
      qb.andWhere(
        `(role."sellerId" = :sellerId OR (role."sellerId" IS NULL AND role.slug != :superAdminSlug))`,
        {
          sellerId: options.sellerId,
          superAdminSlug: DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
        },
      );
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<Role>) {
    return this.repo.create(data);
  }

  save(role: Role) {
    return this.repo.save(role);
  }

  remove(role: Role) {
    return this.repo.remove(role);
  }

  countUsersByRoleId(roleId: string) {
    return this.repo.manager
      .createQueryBuilder()
      .from('users', 'user')
      .where('user.roleId = :roleId', { roleId })
      .getCount();
  }
}
