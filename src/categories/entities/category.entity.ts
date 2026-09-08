import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { SubCategory } from './sub-category.entity.js';
import type { ProductCategory } from './product-category.entity.js';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('SubCategory', 'category')
  subCategories: SubCategory[];

  @OneToMany('ProductCategory', 'category')
  productCategories: ProductCategory[];
}
