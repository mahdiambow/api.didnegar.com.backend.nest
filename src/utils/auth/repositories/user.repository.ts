import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { role: true, seller: true, admin: true, profile: true, addresses: true },
    });
  }

  findByIdOrFail(id: string) {
    return this.repo.findOneOrFail({ where: { id } });
  }

  findByUsername(username: string) {
    return this.repo.findOne({
      where: { username },
      relations: { role: true, seller: true, admin: true },
    });
  }

  findPaginatedForTenant(
    offset: number,
    limit: number,
    options: {
      sellerId: string | null;
      isSuperAdmin: boolean;
      search?: string;
    },
  ) {
    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .orderBy('user.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (!options.isSuperAdmin) {
      qb.andWhere('user.sellerId = :sellerId', { sellerId: options.sellerId });
    }

    if (options.search?.trim()) {
      const search = `%${options.search.trim()}%`;
      qb.andWhere(
        `(user.username LIKE :search
          OR user.displayName LIKE :search
          OR user.email LIKE :search
          OR user.firstName LIKE :search
          OR user.lastName LIKE :search)`,
        { search },
      );
    }

    return qb.getManyAndCount();
  }

  findByUsernameWithPassword(username: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  findByUsernameForOtpVerify(username: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .addSelect(['user.otpCode', 'user.otpExpiresAt', 'user.password'])
      .where('user.username = :username', { username })
      .getOne();
  }

  findByIds(ids: string[]) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id IN (:...ids)', { ids })
      .getMany();
  }

  findAdminIdsBySellerId(sellerId: string) {
    return this.repo
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .where('user.sellerId = :sellerId', { sellerId })
      .orderBy('user.createdAt', 'ASC')
      .getRawMany<{ id: string }>()
      .then((rows) => rows.map((row) => row.id));
  }

  findUsersBySellerId(sellerId: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
      .where('user.sellerId = :sellerId', { sellerId })
      .orderBy('user.createdAt', 'ASC')
      .getMany();
  }

  findUsersByAdminId(adminId: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.admin', 'admin')
      .where('user.adminId = :adminId', { adminId })
      .orderBy('user.createdAt', 'ASC')
      .getMany();
  }

  findUserIdsByAdminId(adminId: string) {
    return this.repo
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .where('user.adminId = :adminId', { adminId })
      .orderBy('user.createdAt', 'ASC')
      .getRawMany<{ id: string }>()
      .then((rows) => rows.map((row) => row.id));
  }

  async setUsersAdminId(userIds: string[], adminId: string | null) {
    if (!userIds.length) return;
    await this.repo
      .createQueryBuilder()
      .update(User)
      .set({ adminId })
      .where('id IN (:...userIds)', { userIds })
      .execute();
  }

  async clearAdminId(adminId: string) {
    await this.repo
      .createQueryBuilder()
      .update(User)
      .set({ adminId: null })
      .where('adminId = :adminId', { adminId })
      .execute();
  }

  create(data: Partial<User>) {
    return this.repo.create(data);
  }

  save(user: User) {
    return this.repo.save(user);
  }

  update(id: string, data: Partial<User>) {
    return this.repo.update(id, data);
  }

  remove(user: User) {
    return this.repo.remove(user);
  }
}
