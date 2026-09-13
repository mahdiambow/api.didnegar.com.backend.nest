import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import type { Product } from '../../products/entities/product.entity.js';
import type { Category } from './category.entity.js';
import type { SubCategory } from './sub-category.entity.js';

@Entity('product_categories')
@Index('uq_product_category', ['productId', 'categoryId', 'subCategoryId'], {
  unique: true,
})
export class ProductCategory {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index('idx_product_categories_productId')
  @Column({ type: 'varchar', length: 26 })
  productId: string;

  @Index('idx_product_categories_categoryId')
  @Column({ type: 'varchar', length: 26, nullable: true })
  categoryId: string | null;

  @Index('idx_product_categories_subCategoryId')
  @Column({ type: 'varchar', length: 26, nullable: true })
  subCategoryId: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Product', 'productCategories', {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne('Category', 'productCategories', {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @ManyToOne('SubCategory', 'productCategories', {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory | null;
}
