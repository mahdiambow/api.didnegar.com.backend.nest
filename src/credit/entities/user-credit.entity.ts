import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';

const wholeNumber = {
  to: (value: number) => value,
  from: (value: string | number | null) =>
    value == null ? 0 : Number(value),
};

@Entity('user_credits')
export class UserCredit {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  /** موجودی قابل‌خرج (عدد صحیح) */
  @Column({ type: 'bigint', default: 0, transformer: wholeNumber })
  amount: number;

  /** مبلغ قفل‌شده (قابل‌خرج نیست تا unlock) */
  @Column({ type: 'bigint', default: 0, transformer: wholeNumber })
  lockedAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
