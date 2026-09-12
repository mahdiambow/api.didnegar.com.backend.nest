import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Seller } from '../../sellers/entities/seller.entity.js';
import type { Product } from '../../products/entities/product.entity.js';
import type { User } from '../../auth/entities/user.entity.js';
import type {
  MediaStatus,
  MediaStorageLocation,
} from './media-asset.enums.js';

@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne('Seller', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @Column({ type: 'uuid' })
  uploadedByUserId: string;

  @ManyToOne('User', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne('Product', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  /** Relative path under staging/gallery root: `{sellerId}/{id}.ext` */
  @Column({ type: 'varchar', length: 500 })
  relativePath: string;

  @Column({ type: 'varchar', length: 20, default: 'staging' })
  storageLocation: MediaStorageLocation;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: MediaStatus;

  @Index()
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Index()
  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
