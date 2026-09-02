import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import { UserProfile } from '../../auth/entities/user-profile.entity.js';
import { UserAddress } from '../../auth/entities/user-address.entity.js';
import { RoleRepository } from '../../roles/repositories/role.repository.js';
import { DEFAULT_ROLE_SLUGS } from '../../roles/permissions.js';

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Admin@1234';

const SEED_USERS = [
  {
    username: '09363078987',
    roleSlug: DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
    displayName: 'Super Admin',
    firstName: 'مدیر',
    lastName: 'سیستم',
    email: 'superadmin@didnegar.com',
  },
  {
    username: '09111111111',
    roleSlug: DEFAULT_ROLE_SLUGS.ADMIN,
    displayName: 'ادمین پلتفرم',
    firstName: 'ادمین',
    lastName: 'پلتفرم',
    email: 'admin@didnegar.com',
  },
  {
    username: '09222222222',
    roleSlug: DEFAULT_ROLE_SLUGS.SELLER,
    displayName: 'مدیر فروشگاه',
    firstName: 'مدیر',
    lastName: 'فروشگاه',
    email: 'seller@didnegar.com',
    sellerKey: 'didnegar-shop',
  },
  {
    username: '09333333333',
    roleSlug: DEFAULT_ROLE_SLUGS.USER,
    displayName: 'کاربر نمونه',
    firstName: 'کاربر',
    lastName: 'نمونه',
    email: 'user@example.com',
    withAddress: true,
  },
] as const;

@Injectable()
export class UsersSeedService {
  private sellerUserIds = new Map<string, string>();

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserAddress)
    private readonly addressRepo: Repository<UserAddress>,
    private readonly roleRepository: RoleRepository,
  ) {}

  async seed() {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const [index, userSeed] of SEED_USERS.entries()) {
      const existing = await this.userRepo.findOne({
        where: { username: userSeed.username },
      });
      if (existing) {
        if ('sellerKey' in userSeed && userSeed.sellerKey) {
          this.sellerUserIds.set(userSeed.sellerKey, existing.id);
        }
        continue;
      }

      const role = await this.roleRepository.findBySlug(userSeed.roleSlug, null);
      if (!role) {
        throw new Error(`Role not found: ${userSeed.roleSlug}`);
      }

      const user = await this.userRepo.save(
        this.userRepo.create({
          username: userSeed.username,
          password: passwordHash,
          displayName: userSeed.displayName,
          firstName: userSeed.firstName,
          lastName: userSeed.lastName,
          email: userSeed.email,
          roleId: role.id,
          legacyId: index + 1,
          legacyTable: 'users',
          isActive: true,
        }),
      );

      await this.profileRepo.save(
        this.profileRepo.create({
          userId: user.id,
          nationalCode: null,
          birthDate: null,
        }),
      );

      if ('withAddress' in userSeed && userSeed.withAddress) {
        await this.addressRepo.save(
          this.addressRepo.create({
            userId: user.id,
            title: 'منزل',
            province: 'تهران',
            city: 'تهران',
            addressDetail: 'خیابان ولیعصر، پلاک ۱۰',
            postalCode: '1234567890',
            recipientFullName: userSeed.displayName,
            recipientPhone: userSeed.username,
            isDefault: true,
          }),
        );
      }

      if ('sellerKey' in userSeed && userSeed.sellerKey) {
        this.sellerUserIds.set(userSeed.sellerKey, user.id);
      }
    }
  }

  getSellerUserId(sellerKey: string) {
    return this.sellerUserIds.get(sellerKey);
  }

  async findUserIdByUsername(username: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    return user?.id;
  }
}
