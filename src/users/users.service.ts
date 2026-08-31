import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { User } from '../auth/entities/user.entity.js';
import { Role } from '../roles/entities/role.entity.js';
import { toUserResponse } from '../auth/dto/user-response.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(query: { page?: string | number; limit?: string | number }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.userRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return paginatedList(
      items.map(toUserResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toUserResponse(user);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ApiException(
        'USER_ALREADY_EXISTS',
        'کاربر با این شماره موبایل از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    await this.ensureRoleExists(dto.roleId);

    const user = this.userRepo.create({
      username: dto.username,
      roleId: dto.roleId,
      email: dto.email ?? null,
      displayName: dto.displayName ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      isActive: dto.isActive ?? true,
      password: dto.password
        ? await bcrypt.hash(dto.password, 10)
        : null,
    });

    const saved = await this.userRepo.save(user);
    const loaded = await this.userRepo.findOneOrFail({ where: { id: saved.id } });
    return toUserResponse(loaded);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.roleId) {
      await this.ensureRoleExists(dto.roleId);
      user.roleId = dto.roleId;
    }

    if (dto.email !== undefined) user.email = dto.email;
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.website !== undefined) user.website = dto.website;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepo.save(user);
    const loaded = await this.userRepo.findOneOrFail({ where: { id } });
    return toUserResponse(loaded);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepo.remove(user);
    return {};
  }

  private async ensureRoleExists(roleId: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
