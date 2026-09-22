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
import type { User } from '../../users/entities/user.entity.js';
import type { WishlistItem } from './wishlist-item.entity.js';

@Entity('wishlists')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class Wishlist {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id: string;
  @Column({ type: 'bigint' }) legacyId: number;
  @Column({ type: 'varchar', length: 255 }) legacyTable: string;
  @Index() @Column({ type: 'varchar', length: 26, nullable: true }) userId:
    string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) name: string | null;
  @CreateDateColumn({ nullable: true }) createdAt: Date | null;
  @UpdateDateColumn({ nullable: true }) updatedAt: Date | null;
  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;
  @OneToMany('WishlistItem', 'wishlist') items: WishlistItem[];
}
