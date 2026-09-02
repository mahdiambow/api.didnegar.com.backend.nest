import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Category } from './category.entity.js';
import type { ProductCategory } from './product-category.entity.js';

@Entity('sub_categories')
@Index(['categoryId', 'slug'], { unique: true })
export class SubCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legacyTable: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  slug: string;

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
