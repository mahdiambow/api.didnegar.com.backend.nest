import {
  PrimaryColumn,
  Check,
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

@Entity('seller_offers')
@Index(['productId'])
@Index(['sellerId'])
@Index(['legacyTable', 'legacyId'], { unique: true })
@Index('IDX_seller_offers_approval_price_id', ['approvalStatus', 'price', 'id'])
@Check('CHK_offer_price', '`price` >= 0')
@Check('CHK_offer_stock', '`stock` >= 0')
export class SellerOffer {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id: string;
  @Column({ type: 'bigint', nullable: true }) legacyId: number | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) legacyTable:
    string | null;
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 26, nullable: true })
  legacySourceId: string | null;
  @Column({ type: 'varchar', length: 26 }) sellerId: string;
  @Column({ type: 'varchar', length: 26 }) productId: string;
  @Column({ type: 'json', default: {} }) attributes: Record<string, string>;
  @Column({ type: 'varchar', length: 100, nullable: true }) sku: string | null;
  @Column({ type: 'decimal', precision: 19, scale: 4 }) price: number;
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  minPrice: number | null;
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  maxPrice: number | null;
  @Column({ type: 'int', default: 0 }) stock: number;
  @Column({ type: 'varchar', length: 50, default: 'outofstock' })
  stockStatus: string;
  @Column({ type: 'boolean', default: false }) isVirtual: boolean;
  @Column({ type: 'boolean', default: false }) isDownloadable: boolean;
  @Column({ type: 'boolean', default: false }) isOnSale: boolean;
  @Column({ type: 'varchar', length: 50, nullable: true }) taxStatus:
    string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) taxClass:
    string | null;
  @Column({ type: 'longtext', nullable: true }) description: string | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) weight:
    number | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) length:
    number | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) width:
    number | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) height:
    number | null;
  @Column({ type: 'varchar', length: 2048, nullable: true }) image:
    string | null;
  @Column({ type: 'boolean', default: true }) isActive: boolean;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'approved' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @ManyToOne('Seller', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;
  @ManyToOne('Product', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
