import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity.js';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin) private readonly repo: Repository<Admin>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByIds(ids: string[]) {
    if (!ids.length) return Promise.resolve([] as Admin[]);
    return this.repo.find({ where: { id: In([...new Set(ids)]) } });
  }

  findByPhone(phone: string) {
    return this.repo.findOne({ where: { phone } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findPaginated(offset: number, limit: number, search?: string) {
    const qb = this.repo
      .createQueryBuilder('admin')
      .orderBy('admin.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      qb.andWhere(
        '(admin.name LIKE :q OR admin.phone LIKE :q OR admin.email LIKE :q)',
        { q },
      );
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<Admin>) {
    return this.repo.create(data);
  }

  save(admin: Admin) {
    return this.repo.save(admin);
  }

  remove(admin: Admin) {
    return this.repo.remove(admin);
  }
}
