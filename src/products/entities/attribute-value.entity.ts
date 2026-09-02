import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { ProductVariantAttribute } from './product-variant-attribute.entity.js';

@Entity('attribute_values')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class AttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legacyTable: string | null;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('ProductVariantAttribute', 'attributeValue')
  variantAttributes: ProductVariantAttribute[];
}
