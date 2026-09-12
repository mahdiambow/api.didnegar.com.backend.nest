import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import { SellerRepository } from '../../sellers/repositories/seller.repository.js';
import { SellerContractRepository } from '../../sellers/repositories/seller-contract.repository.js';
import { BusinessType, SellerStatus } from '../../sellers/entities/seller.enums.js';
import {
  SEED_DEFAULT_SELLER_SLUG,
  UsersSeedService,
} from './users.seed.service.js';

const SEED_SELLER = {
  key: SEED_DEFAULT_SELLER_SLUG,
  slug: SEED_DEFAULT_SELLER_SLUG,
  name: 'فروشگاه دیدنگار',
  businessName: 'شرکت دیدنگار',
  email: 'shop@didnegar.com',
  phone: '02112345678',
  address: 'تهران، خیابان ولیعصر',
  city: 'تهران',
  postalCode: '1234567890',
} as const;

/** شماره‌هایی که JWT.sellerId باید پر باشد */
const SELLER_LINKED_USERNAMES = [
  '09363078987',
  '09393341873',
  '09222222222',
  '09444444444',
] as const;

@Injectable()
export class SellersSeedService {
  constructor(
    private readonly sellerRepository: SellerRepository,
    private readonly sellerContractRepository: SellerContractRepository,
    private readonly usersSeedService: UsersSeedService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async seed() {
    let seller = await this.sellerRepository.findBySlug(SEED_SELLER.slug);
    if (!seller) {
      seller = await this.sellerRepository.save(
        this.sellerRepository.create({
          slug: SEED_SELLER.slug,
          name: SEED_SELLER.name,
          businessName: SEED_SELLER.businessName,
          businessType: BusinessType.RETAIL,
          email: SEED_SELLER.email,
          phone: SEED_SELLER.phone,
          address: SEED_SELLER.address,
          city: SEED_SELLER.city,
          postalCode: SEED_SELLER.postalCode,
          status: SellerStatus.ACTIVE,
          settings: {},
        }),
      );
    }

    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ sellerId: seller.id })
      .where('username IN (:...usernames)', {
        usernames: [...SELLER_LINKED_USERNAMES],
      })
      .execute();

    const adminUserId =
      (await this.usersSeedService.findUserIdByUsername('09222222222')) ??
      this.usersSeedService.getSellerUserId(SEED_SELLER.key);

    const contract = await this.sellerContractRepository.findLatestBySellerId(
      seller.id,
    );
    if (!contract && adminUserId) {
      await this.sellerContractRepository.save(
        this.sellerContractRepository.create({
          sellerId: seller.id,
          sellerName: SEED_SELLER.businessName,
          userIds: [adminUserId],
          contractPartyName: 'Didnegar Platform',
          description: 'قرارداد اولیه فروشگاه',
          contractDate: new Date(),
        }),
      );
    }
  }
}
