import {
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import type { Seller } from '../../sellers/entities/seller.entity.js';
import type { Product } from '../../products/entities/product.entity.js';
import type { User } from '../../users/entities/user.entity.js';
import type {
  MediaGroup,
  MediaScope,
  MediaStorageLocation,
} from './media-asset.enums.js';

@Entity('media_assets')
export class MediaAsset {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ name: 'group', type: 'varchar', length: 20, default: 'other' })
  group: MediaGroup;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'legacy' })
  scope: MediaScope;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  sellerId: string | null;

  @ManyToOne('Seller', { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller | null;

  @Column({ type: 'varchar', length: 26 })
  uploadedByUserId: string;

  @ManyToOne('User', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy: User;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  productId: string | null;

  @ManyToOne('Product', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  alt: string | null;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  /** Relative path under staging/gallery root:
   * seller → `seller/{sellerId}/{id}.ext`
   * others → `{group}/{id}.ext`
   */
  @Column({ type: 'varchar', length: 500 })
  relativePath: string;

  @Column({ type: 'varchar', length: 20, default: 'staging' })
  storageLocation: MediaStorageLocation;

  @Index()
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Index()
  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
