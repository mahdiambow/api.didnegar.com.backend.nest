import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { Brand } from './brand.entity.js';
import type { ProductCategory } from '../../categories/entities/product-category.entity.js';
import type { ProductVariant } from './product-variant.entity.js';
import type { ProductStock } from './product-stock.entity.js';

export type ProductSeoItem = { key: string; val: string };

export type ProductImageData = {
  featuredImg: string | null;
  gallery: string[];
};

export type ProductPriceData = {
  attributeIds: string[];
  price: number | null;
  discountPercentage: number | null;
  discountAmount: number | null;
  expireDate: string | null;
  maxQuantity: number | null;
  minQuantity: number | null;
  finalPrice: number | null;
};

export type ProductTableInfoItem = {
  name: string;
  items: ProductSeoItem[];
};

export type ProductShippingMethodData = {
  slug: string;
  name: string;
  price: number;
  isCod: boolean;
  isActive: boolean;
  sortOrder: number;
};

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

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescription: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'publish' })
  status: string;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @Column({ type: 'boolean', default: false })
  isVirtual: boolean;

  @Column({ type: 'boolean', default: false })
  isDownloadable: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'json', default: [] })
  seo: ProductSeoItem[];

  @Column({
    type: 'json',
    default: () => `'{"featuredImg":null,"gallery":[]}'`,
  })
  image: ProductImageData;

  @Column({ type: 'json', nullable: true })
  price: ProductPriceData | null;

  @Column({ type: 'json', nullable: true })
  shippingMethod: ProductShippingMethodData | null;

  @Column({ type: 'json', default: [] })
  tableInfo: ProductTableInfoItem[];

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

  @Column({ type: 'json', default: [] })
  attributeIds: string[];

  @Column({ type: 'json', default: [] })
  sellerIds: string[];

  @Column({ type: 'uuid', nullable: true })
  createdBySellerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Brand', 'products', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @OneToMany('ProductCategory', 'product')
  productCategories: ProductCategory[];

  @OneToMany('ProductVariant', 'product')
  variants: ProductVariant[];

  @OneToOne('ProductStock', 'product')
  productStock: ProductStock | null;
}
