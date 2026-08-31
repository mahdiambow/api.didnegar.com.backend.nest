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

  findPaginated(offset: number, limit: number) {
    return this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  findByUsernameWithPassword(username: string) {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  findByUsernameForOtpVerify(username: string) {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect(['user.otpCode', 'user.otpExpiresAt', 'user.password'])
      .where('user.username = :username', { username })
      .getOne();
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
