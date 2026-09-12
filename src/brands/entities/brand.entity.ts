import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Product } from '../../products/entities/product.entity.js';

@Entity('brands')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  /** نام فارسی */
  @Index()
  @Column({ type: 'varchar', length: 200 })
  name: string;

  /** نام انگلیسی */
  @Column({ type: 'varchar', length: 200, nullable: true })
  nameEn: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  /** URL تصویر لوگو */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  logoUrl: string | null;

  /** توضیحات سئو */
  @Column({ type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Product', 'brand')
  products: Product[];
}
