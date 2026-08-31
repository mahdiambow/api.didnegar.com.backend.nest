import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity.js';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role) private readonly repo: Repository<Role>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findPaginated(offset: number, limit: number) {
    return this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
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
