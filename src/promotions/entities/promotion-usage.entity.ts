import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Promotion } from './promotion.entity.js';
import type { User } from '../../users/entities/user.entity.js';
import type { Customer } from '../../customers/entities/customer.entity.js';
import type { Order } from '../../orders/entities/order.entity.js';

@Entity('promotion_usages')
@Index(['promotionId', 'userId'])
@Index(['promotionId', 'customerId'])
export class PromotionUsage {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  promotionId: string;

  /** کاربر آنلاین — برای سفارش type=user */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  /** مشتری تلفنی — برای سفارش type=customer */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  customerId: string | null;

  @Column({ type: 'varchar', length: 26, nullable: true })
  orderId: string | null;

  /** مبلغ تخفیف اعمال‌شده در این استفاده */
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  discountAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Promotion', 'usages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotionId' })
  promotion: Promotion;

  @ManyToOne('User', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne('Customer', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @ManyToOne('Order', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;
}
