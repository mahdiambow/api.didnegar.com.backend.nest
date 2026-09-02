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
import type { Brand } from './brand.entity.js';
import type { ProductCategory } from '../../categories/entities/product-category.entity.js';

@Entity('products')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescription: string | null;

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'publish' })
  status: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

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

  @Index()
  @Column({ type: 'boolean', default: false })
  isOnSale: boolean;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalSales: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxStatus: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxClass: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  globalUniqueId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Brand', 'products', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @OneToMany('ProductCategory', 'product')
  productCategories: ProductCategory[];
}
