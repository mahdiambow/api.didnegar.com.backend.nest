import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import type { Order } from '../../orders/entities/order.entity.js';
import type {
  TransactionSourceType,
  TransactionState,
  TransactionType,
  TransactionUserType,
} from './transaction.types.js';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  /** مبلغ (عدد صحیح، همیشه مثبت) */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  type: TransactionType;

  @Column({ type: 'varchar', length: 40 })
  sourceType: TransactionSourceType;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  sourceId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  state: TransactionState;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  userType: TransactionUserType;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

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
