import { PrimaryColumn, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, UpdateDateColumn } from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import type { OrderItem } from '../../orders/entities/order-item.entity.js';
import type { Payment } from './payment.entity.js';
import type { ShippingMethod } from '../../shipping/entities/shipping-method.entity.js';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({ type: 'varchar', length: 26, nullable: true })
  shippingMethodId: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany('OrderItem', 'order', { cascade: ['insert', 'update'] })
  items: OrderItem[];

  @ManyToOne('ShippingMethod', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shippingMethodId' })
  shippingMethod: ShippingMethod | null;

  @OneToOne('Payment', 'order')
  payment: Payment;
}
