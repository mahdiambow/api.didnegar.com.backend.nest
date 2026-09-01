import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { toUserResponse } from '../auth/dto/user-response.dto.js';
import { UserRepository } from '../auth/repositories/user.repository.js';
import { RoleRepository } from '../roles/repositories/role.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async findAll(query: { page?: string | number; limit?: string | number }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.userRepository.findPaginated(
      offset,
      limit,
    );

    return paginatedList(
      items.map(toUserResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
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
    const existing = await this.userRepository.findByUsername(dto.username);
    if (existing) {
      throw new ApiException(
        'USER_ALREADY_EXISTS',
        'کاربر با این شماره موبایل از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    await this.ensureRoleExists(dto.roleId);

    const saved = await this.userRepository.save(
      this.userRepository.create({
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
      }),
    );

    const loaded = await this.userRepository.findByIdOrFail(saved.id);
    return toUserResponse(loaded);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
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

    await this.userRepository.save(user);
    const loaded = await this.userRepository.findByIdOrFail(id);
    return toUserResponse(loaded);
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiException(
        'USER_NOT_FOUND',
        'کاربر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepository.remove(user);
    return {};
  }

  private async ensureRoleExists(roleId: string) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
