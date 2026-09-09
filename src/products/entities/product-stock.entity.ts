import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import type { Product } from './product.entity.js';

@Entity('product_stocks')
@Check('CHK_product_stock', '`stock` >= 0')
export class ProductStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
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
