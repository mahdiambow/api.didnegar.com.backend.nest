import {
  Check,
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
import type { SellerOffer } from '../../offers/entities/seller-offer.entity.js';

@Entity('offer_products')
@Index(['sellerId'])
@Index(['approvalStatus'])
@Check('CHK_offer_product_price', '`price` >= 0')
@Check('CHK_offer_product_stock', '`stock` >= 0')
export class OfferProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescription: string | null;

  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @Column({ type: 'json', default: [] })
  categoryIds: string[];

  @Column({ type: 'json', default: {} })
  attributes: Record<string, string[]>;

  @Column({ type: 'boolean', default: false })
  isVirtual: boolean;

  @Column({ type: 'boolean', default: false })
  isDownloadable: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxStatus: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxClass: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number | null;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 50, default: 'outofstock' })
  stockStatus: string;

  @Column({ type: 'boolean', default: false })
  isOnSale: boolean;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'uuid', nullable: true })
  offerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Seller', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @ManyToOne('Product', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @ManyToOne('SellerOffer', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offerId' })
  offer: SellerOffer | null;
}
