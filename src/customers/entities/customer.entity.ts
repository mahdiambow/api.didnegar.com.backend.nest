import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { City } from '../../locations/entities/city.entity.js';
import type { Country } from '../../locations/entities/country.entity.js';
import type { State } from '../../locations/entities/state.entity.js';
import type { Seller } from '../../sellers/entities/seller.entity.js';
import type { User } from '../../users/entities/user.entity.js';

/**
 * خریدار تلفنی / رکورد لگاسی سفارش — جدا از حساب User.
 * سوپرسلر برای سفارش تلفنی این فرم را پر می‌کند؛ در گزارش‌ها با users قاطی نمی‌شود.
 */
@Entity('customers')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class Customer {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legacyTable: string | null;

  /** لینک اختیاری بعداً — فرم تلفنی user نمی‌سازد */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  /** فروشگاهی که این مشتری تلفنی را ثبت کرده */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  sellerId: string | null;

  /** کاربر سوپرسلر که فرم را پر کرده */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  createdByUserId: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  countryId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  /** مشتری همکار — سفارش همکار از موجودی انبار کم نمی‌کند */
  @Column({ type: 'boolean', default: false })
  isHamkar: boolean;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  cityId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  stateId: string | null;

  @CreateDateColumn({ nullable: true })
  createdAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastActiveAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne('Seller', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser: User | null;

  @ManyToOne('Country', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'countryId' })
  country: Country | null;

  @ManyToOne('State', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stateId' })
  state: State | null;

  @ManyToOne('City', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cityId' })
  city: City | null;
}
