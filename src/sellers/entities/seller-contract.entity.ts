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

@Entity('seller_contracts')
export class SellerContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sellerId: string | null;

  @Column({ type: 'varchar', length: 150 })
  sellerName: string;

  @Column({ type: 'json', default: [] })
  userIds: string[];

  @Column({ type: 'varchar', length: 150 })
  contractPartyName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'datetime' })
  contractDate: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne('Seller', 'contracts', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller | null;
}
