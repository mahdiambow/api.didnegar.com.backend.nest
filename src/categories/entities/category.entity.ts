import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import type { ParentCategory } from './parent-category.entity.js';
import type { SubCategory } from './sub-category.entity.js';
import type { ProductCategory } from './product-category.entity.js';

@Entity('categories')
export class Category {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  parentCategoryId: string;

  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legacyTable: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameEn: string | null;

  @Index({ unique: true })
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('ParentCategory', 'categories', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parentCategoryId' })
  parentCategory: ParentCategory;

  @OneToMany('SubCategory', 'category')
  subCategories: SubCategory[];

  @OneToMany('ProductCategory', 'category')
  productCategories: ProductCategory[];
}
