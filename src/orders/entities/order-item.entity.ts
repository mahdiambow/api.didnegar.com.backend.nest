import { PrimaryColumn, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Order } from './order.entity.js';
import type { SellerOffer } from '../../offers/entities/seller-offer.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
  orderId: string;

  @Column({ type: 'varchar', length: 26 })
  productId: string;

  @Column({ type: 'varchar', length: 26, nullable: true })
  offerId: string | null;

  @Column({ type: 'json', default: {} })
  attributes: Record<string, string>;

  @Column({ type: 'varchar', length: 26, nullable: true })
  sellerId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @ManyToOne('SellerOffer', { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'offerId' })
  offer: SellerOffer | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  unitPrice: number;

  @ManyToOne('Order', 'items', {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne('Product', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
