import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Product } from '../../products/entities/product.entity.js';
import type { Wishlist } from './wishlist.entity.js';

@Entity('wishlist_items')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class WishlistItem {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id: string;
  @Column({ type: 'bigint' }) legacyId: number;
  @Column({ type: 'varchar', length: 255 }) legacyTable: string;
  @Index() @Column({ type: 'varchar', length: 26 }) wishlistId: string;
  @Index() @Column({ type: 'varchar', length: 26, nullable: true }) productId:
    string | null;
  @Column({ type: 'datetime', nullable: true }) addedAt: Date | null;
  @Column({ type: 'boolean', default: false }) wasOnSale: boolean;
  @ManyToOne('Wishlist', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wishlistId' })
  wishlist: Wishlist;
  @ManyToOne('Product', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;
}
