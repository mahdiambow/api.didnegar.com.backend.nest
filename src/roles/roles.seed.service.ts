import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
} from './permissions.js';
import { Role } from './entities/role.entity.js';

@Injectable()
export class RolesSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRole(DEFAULT_ROLE_SLUGS.USER, 'کاربر', false);
    await this.seedRole(DEFAULT_ROLE_SLUGS.ADMIN, 'مدیر', true);
  }

  private async seedRole(slug: string, name: string, isSystem: boolean) {
    const existing = await this.roleRepo.findOne({ where: { slug } });
    if (existing) {
      return existing;
    }

    return this.roleRepo.save(
      this.roleRepo.create({
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

  async getDefaultUserRole(): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { slug: DEFAULT_ROLE_SLUGS.USER },
    });
    if (!role) {
      throw new Error('Default user role not found');
    }
    return role;
  }
}
