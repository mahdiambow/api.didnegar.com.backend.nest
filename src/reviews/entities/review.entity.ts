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
import type { Product } from '../../products/entities/product.entity.js';
import type { User } from '../../users/entities/user.entity.js';

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
  status: 'approved' | 'pending' | 'spam';

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  parentId: string | null;

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

  @ManyToOne('Review', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Review | null;
}
