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

@Entity('seller_offers')
@Index(['productId'])
@Index(['sellerId', 'sku'], { unique: true })
@Check('CHK_offer_price', '"price" >= 0')
@Check('CHK_offer_stock', '"stockQuantity" >= 0')
export class SellerOffer {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) sellerId: string;
  @Column({ type: 'uuid' }) productId: string;
  @Column({ type: 'jsonb', default: {} }) attributes: Record<string, string>;
  @Column({ type: 'varchar', length: 100 }) sku: string;
  @Column({ type: 'decimal', precision: 19, scale: 4 }) price: number;
  @Column({ type: 'int', default: 0 }) stockQuantity: number;
  @Column({ type: 'varchar', length: 50, default: 'outofstock' })
  stockStatus: string;
  @Column({ type: 'boolean', default: false }) isOnSale: boolean;
  @Column({ type: 'varchar', length: 50, nullable: true }) taxStatus:
    string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) taxClass:
    string | null;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @ManyToOne('Seller', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;
  @ManyToOne('Product', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
