import {
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import type { UserAddress } from '../../users/entities/user-address.entity.js';
import type { Customer } from '../../customers/entities/customer.entity.js';
import type { OrderItem } from './order-item.entity.js';
import type { Deposit } from '../../deposits/entities/deposit.entity.js';
import type { ShippingMethod } from '../../shipping/entities/shipping-method.entity.js';

/**
 * وضعیت سفارش:
 * - pending: در انتظار پرداخت
 * - processing: در حال پردازش
 * - left_warehouse: خروج از انبار
 * - shipped: ارسال شده
 * - failed / cancelled: پرداخت ناموفق / لغو
 */
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'left_warehouse',
  'shipped',
  'failed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** سفارش‌هایی که پرداخت شده و در جریان fulfillment هستند */
export const ORDER_FULFILLMENT_STATUSES = [
  'processing',
  'left_warehouse',
  'shipped',
] as const;

/** user = خرید آنلاین کاربر | customer = سفارش تلفنی سوپرسلر */
export type OrderType = 'user' | 'customer';

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 26, nullable: true })
  customerId: string | null;

  @Column({ type: 'varchar', length: 26, nullable: true })
  addressId: string | null;

  @Column({ type: 'varchar', length: 26, nullable: true })
  shippingMethodId: string | null;

  /** همه روش‌های ارسال انتخاب‌شده در checkout */
  @Column({ type: 'json', nullable: true })
  shippingMethodIds: string[] | null;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  /** مبلغ تخفیف سفارش */
  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  discountAmount: number;

  /**
   * روش پرداخت — مثل CreateOrder:
   * credit | iBank | loan | partial-bank
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  type: OrderType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne('Customer', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @ManyToOne('UserAddress', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'addressId' })
  address: UserAddress | null;

  @OneToMany('OrderItem', 'order', { cascade: ['insert', 'update'] })
  items: OrderItem[];

  @ManyToOne('ShippingMethod', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shippingMethodId' })
  shippingMethod: ShippingMethod | null;

  @OneToMany('Deposit', 'order')
  deposits: Deposit[];
}
