import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { User } from '../../auth/entities/user.entity.js';

export type CreditLedgerType = 'deposit' | 'charge';

@Entity('credit_ledger')
export class CreditLedger {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  /** مبلغ مثبت برای deposit و charge (علامت از type) */
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  type: CreditLedgerType;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  orderId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  paymentId: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
