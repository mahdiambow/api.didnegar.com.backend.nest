import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { Product } from './product.entity.js';
import type { ProductVariantAttribute } from './product-variant-attribute.entity.js';

@Entity('product_variants')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  minPrice: number | null;

  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  maxPrice: number | null;

  @Column({ type: 'boolean', default: false })
  isVirtual: boolean;

  @Column({ type: 'boolean', default: false })
  isDownloadable: boolean;

  @Column({ type: 'int', nullable: true })
  stockQuantity: number | null;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  stockStatus: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxStatus: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxClass: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'publish' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Product', 'variants', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany('ProductVariantAttribute', 'variant')
  variantAttributes: ProductVariantAttribute[];
}
