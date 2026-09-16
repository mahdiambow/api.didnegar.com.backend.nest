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
import type { User } from '../../users/entities/user.entity.js';

@Entity('newsletter_subscriptions')
export class NewsletterSubscription {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 26 })
  userId: string;

  /** ایمیل از پروفایل کاربر در زمان عضویت */
  @Index()
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
