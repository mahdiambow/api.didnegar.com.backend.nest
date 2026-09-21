import {
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import type { Order } from '../../orders/entities/order.entity.js';
import type { User } from '../../users/entities/user.entity.js';

export type DepositStatus = 'pending' | 'success' | 'failed';
export type DepositGateway = 'iBank' | 'loan' | 'credit';

/** واریز به کیف پول — orderId اختیاری است */
@Entity('deposits')
export class Deposit {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  /** اختیاری — شارژ wallet بدون سفارش null است */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'iBank' })
  gateway: DepositGateway;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  trackId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  refId: string | null;

  @Column({ type: 'bigint' })
  amount: number;

  /** مبلغ قفل‌شده از کیف پول در پرداخت ترکیبی (partial-bank)؛ درگاه فقط amount را می‌گیرد */
  @Column({ type: 'bigint', default: 0 })
  creditApplied: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: DepositStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  callbackUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Order', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;
}
