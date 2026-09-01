import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByIdOrFail(id: string) {
    return this.repo.findOneOrFail({ where: { id } });
  }

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  findPaginatedForTenant(
    offset: number,
    limit: number,
    options: { sellerId: string | null; isSuperAdmin: boolean },
  ) {
    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
      .orderBy('user.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (!options.isSuperAdmin) {
      qb.andWhere('user.sellerId = :sellerId', { sellerId: options.sellerId });
    }

    return qb.getManyAndCount();
  }

  findByUsernameWithPassword(username: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  findByUsernameForOtpVerify(username: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.seller', 'seller')
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
    return this.findUsersBySellerId(sellerId).then((users) =>
      users.map((user) => user.id),
    );
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
