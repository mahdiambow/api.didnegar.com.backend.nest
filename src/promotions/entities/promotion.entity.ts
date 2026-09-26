import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PromotionUsage } from './promotion-usage.entity.js';

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

@Entity('promotions')
export class Promotion {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** کد کوپن — اگر null باشد پروموشن خودکار/بدون کد است */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 20 })
  discountType: DiscountType;

  /** مقدار تخفیف: ۲۰ برای ۲۰٪ یا مبلغ ثابت به تومان */
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  discountValue: number;

  /**
   * قیمت نهایی بعد از تخفیف (اختیاری).
   * اگر ست شود، تخفیف = مبلغ سفارش − discountPrice محاسبه می‌شود.
   */
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  discountPrice: number | null;

  @Column({ type: 'datetime', nullable: true })
  discountStartAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  discountEndAt: Date | null;

  /** حداقل مبلغ سفارش برای اعمال */
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  minOrderAmount: number | null;

  /** سقف مبلغ تخفیف در هر بار اعمال (مخصوصاً درصدی) */
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  maxDiscountAmount: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** سقف کل تعداد استفاده در سیستم — null = نامحدود */
  @Column({ type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  /** تا چند بار هر یوزر می‌تواند استفاده کند — null = نامحدود */
  @Column({ type: 'int', nullable: true })
  usageLimitPerUser: number | null;

  /** سقف مجموع مبلغ تخفیف دریافتی هر یوزر از این پروموشن — null = نامحدود */
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  maxDiscountAmountPerUser: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('PromotionUsage', 'promotion')
  usages: PromotionUsage[];
}
