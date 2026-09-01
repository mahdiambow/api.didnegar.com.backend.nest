import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BusinessType, SellerStatus } from './seller.enums.js';
import type { SellerSettings } from '../types/seller-settings.type.js';
import type { User } from '../../auth/entities/user.entity.js';
import type { Role } from '../../roles/entities/role.entity.js';
import type { SellerContract } from './seller-contract.entity.js';

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 200 })
  businessName: string;

  @Column({ type: 'varchar', length: 50, default: BusinessType.OTHER })
  businessType: BusinessType;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nationalId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 20, default: SellerStatus.ACTIVE })
  status: SellerStatus;

  @Column({ type: 'jsonb', default: {} })
  settings: SellerSettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('User', 'seller')
  users: User[];

  @OneToMany('Role', 'seller')
  roles: Role[];

  @OneToMany('SellerContract', 'seller')
  contracts: SellerContract[];
}
