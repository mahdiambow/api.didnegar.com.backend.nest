import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
} from './permissions.js';
import { RoleRepository } from './repositories/role.repository.js';

@Injectable()
export class RolesSeedService implements OnModuleInit {
  constructor(private readonly roleRepository: RoleRepository) {}

  async onModuleInit() {
    await this.seedRole(DEFAULT_ROLE_SLUGS.USER, 'کاربر', false);
    await this.seedRole(DEFAULT_ROLE_SLUGS.ADMIN, 'مدیر', true);
  }

  private async seedRole(slug: string, name: string, isSystem: boolean) {
    const existing = await this.roleRepository.findBySlug(slug);
    if (existing) {
      return existing;
    }

    return this.roleRepository.save(
      this.roleRepository.create({
        slug,
        name,
        isSystem,
        permissions: [
          ...(DEFAULT_ROLE_PERMISSIONS[
            slug as keyof typeof DEFAULT_ROLE_PERMISSIONS
          ] ?? []),
        ],
      }),
    );
  }

  async getDefaultUserRole() {
    const role = await this.roleRepository.findBySlug(DEFAULT_ROLE_SLUGS.USER);
    if (!role) {
      throw new Error('Default user role not found');
    }
    return role;
  }
}
