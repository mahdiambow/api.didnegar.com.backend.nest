import {
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import type { Order } from './order.entity.js';

export type DepositStatus = 'pending' | 'success' | 'failed';
export type DepositGateway = 'zarinpal' | 'zibal' | 'loan' | 'credit';

@Entity('deposits')
export class Deposit {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
  orderId: string;

  @Column({ type: 'varchar', length: 20, default: 'zarinpal' })
  gateway: DepositGateway;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  trackId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  refId: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: DepositStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  callbackUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('Order', 'deposit', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
