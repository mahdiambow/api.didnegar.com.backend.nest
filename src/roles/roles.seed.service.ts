import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
  type DefaultRoleSlug,
} from './permissions.js';
import { RoleRepository } from './repositories/role.repository.js';

const SYSTEM_ROLE_NAMES: Record<DefaultRoleSlug, string> = {
  [DEFAULT_ROLE_SLUGS.USER]: 'کاربر',
  [DEFAULT_ROLE_SLUGS.SELLER]: 'فروشنده',
  [DEFAULT_ROLE_SLUGS.ADMIN]: 'ادمین',
  [DEFAULT_ROLE_SLUGS.SUPER_ADMIN]: 'Didnegar',
};

@Injectable()
export class RolesSeedService implements OnModuleInit {
  constructor(private readonly roleRepository: RoleRepository) {}

  async onModuleInit() {
    for (const slug of Object.values(DEFAULT_ROLE_SLUGS)) {
      await this.seedSystemRole(slug);
    }
  }

  private async seedSystemRole(slug: DefaultRoleSlug) {
    const existing = await this.roleRepository.findBySlug(slug, null);
    if (existing) {
      existing.name = SYSTEM_ROLE_NAMES[slug];
      existing.isSystem = true;
      existing.sellerId = null;
      existing.permissions = [...DEFAULT_ROLE_PERMISSIONS[slug]];
      return this.roleRepository.save(existing);
    }

    return this.roleRepository.save(
      this.roleRepository.create({
        slug,
        name: SYSTEM_ROLE_NAMES[slug],
        isSystem: true,
        sellerId: null,
        permissions: [...DEFAULT_ROLE_PERMISSIONS[slug]],
      }),
    );
  }

  async getDefaultUserRole() {
    const role = await this.roleRepository.findBySlug(
      DEFAULT_ROLE_SLUGS.USER,
      null,
    );
    if (!role) {
      throw new Error('Default user role not found');
    }
    return role;
  }
}
