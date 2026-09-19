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

  /** مبلغ این عملیات (همیشه مثبت، عدد صحیح) */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  sourceType: CreditSourceType;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  sourceId: string | null;

  @Column({ type: 'bigint' })
  amountBefore: number;

  @Column({ type: 'bigint' })
  amountAfter: number;

  @Column({ type: 'bigint' })
  lockedBefore: number;

  @Column({ type: 'bigint' })
  lockedAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
