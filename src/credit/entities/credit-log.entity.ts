import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import { CreditSourceType } from '../credit-source-type.enum.js';

@Entity('credit_logs')
export class CreditLog {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  /** مبلغ این عملیات (همیشه مثبت) */
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  sourceType: CreditSourceType;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  sourceId: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amountBefore: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amountAfter: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  lockedBefore: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  lockedAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
