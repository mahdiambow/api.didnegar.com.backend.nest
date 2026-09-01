import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Seller } from './seller.entity.js';
import type { User } from '../../auth/entities/user.entity.js';

@Entity('seller_contracts')
export class SellerContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sellerId: string;

  @Column({ type: 'varchar', length: 150 })
  sellerName: string;

  @Index()
  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'varchar', length: 150 })
  contractPartyName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz' })
  contractDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne('Seller', 'contracts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @ManyToOne('User', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'adminId' })
  admin: User;
}
