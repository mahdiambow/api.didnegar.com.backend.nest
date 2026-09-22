import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Product } from '../../products/entities/product.entity.js';
import type { User } from '../../users/entities/user.entity.js';

export type ReviewStatus = 'approved' | 'pending' | 'spam';

/**
 * Product review / comment.
 *
 * Nested replies: root reviews have `parentId = null`; replies point at a parent.
 * Rating rules (enforced in service, not DB):
 * - If the user has a paid order containing this productId → rating is required (root only).
 * - Otherwise rating is optional.
 * - Replies never carry a rating.
 */
@Entity('reviews')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class Review {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  productId: string;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorName: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  authorEmail: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  authorUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  authorIp: string | null;

  @Column({ type: 'longtext' })
  content: string;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ReviewStatus;

  /** Null = root review; set = nested reply under another review. */
  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  parentId: string | null;

  /**
   * 1–5 when present. Nullable in DB because:
   * - non-buyers may omit it
   * - nested replies never set it
   * Buyers writing a root review must supply it (service-level).
   */
  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  rating: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Product', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne('Review', 'replies', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Review | null;

  @OneToMany('Review', 'parent')
  replies: Review[];
}
