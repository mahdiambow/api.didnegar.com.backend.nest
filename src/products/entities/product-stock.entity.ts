import { PrimaryColumn, Check, Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, UpdateDateColumn } from 'typeorm';
import type { Product } from './product.entity.js';

@Entity('product_stocks')
@Check('CHK_product_stock', '`stock` >= 0')
export class ProductStock {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 26 })
  productId: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('Product', 'productStock', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
