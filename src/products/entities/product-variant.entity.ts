import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { Product } from './product.entity.js';
import type { ProductVariantAttribute } from './product-variant-attribute.entity.js';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne('Product', 'variants', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany('ProductVariantAttribute', 'variant')
  variantAttributes: ProductVariantAttribute[];
}
