import { PrimaryColumn, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Product } from './product.entity.js';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ name: 'product_id', type: 'varchar', length: 26 })
  productId: string;

  @ManyToOne('Product', 'variants', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
