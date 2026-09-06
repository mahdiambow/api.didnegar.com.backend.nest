import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Order } from '../../payments/entities/order.entity.js';
import type { SellerOffer } from '../../offers/entities/seller-offer.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  offerId: string | null;

  @Column({ type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ type: 'uuid', nullable: true })
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
