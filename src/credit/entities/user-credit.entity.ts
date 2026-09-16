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
import type { User } from '../../auth/entities/user.entity.js';

@Entity('user_credits')
export class UserCredit {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
