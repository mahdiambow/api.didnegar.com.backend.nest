import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Product } from '../../products/entities/product.entity.js';
import type { Category } from './category.entity.js';
import type { SubCategory } from './sub-category.entity.js';

@Entity('product_categories')
@Index(['productId', 'categoryId', 'subCategoryId'], { unique: true })
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  subCategoryId: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Product', 'productCategories', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne('Category', 'productCategories', {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @ManyToOne('SubCategory', 'productCategories', {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory | null;
}
