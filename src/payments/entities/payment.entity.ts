import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Order } from './order.entity.js';

export type PaymentStatus = 'pending' | 'success' | 'failed';
export type PaymentGateway = 'zarinpal';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 20, default: 'zarinpal' })
  gateway: PaymentGateway;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  authority: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  refId: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  callbackUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('Order', 'payment', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
