import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import type { Category } from './category.entity.js';
import type { ProductCategory } from './product-category.entity.js';

@Entity('sub_categories')
@Index(['categoryId', 'slug'], { unique: true })
export class SubCategory {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  categoryId: string;

  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legacyTable: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameEn: string | null;

  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  image: string | null;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSpecial: boolean;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  specialImage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Category', 'subCategories', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany('ProductCategory', 'subCategory')
  productCategories: ProductCategory[];
}
