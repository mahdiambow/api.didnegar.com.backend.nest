import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, UpdateDateColumn } from 'typeorm';
import type { Order } from './order.entity.js';

export type PaymentStatus = 'pending' | 'success' | 'failed';
export type PaymentGateway = 'zarinpal' | 'zibal';

@Entity('payments')
export class Payment {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
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
