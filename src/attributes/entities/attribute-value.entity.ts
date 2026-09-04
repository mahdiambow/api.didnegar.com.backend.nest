import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { Attribute } from './attribute.entity.js';
import type { ProductVariantAttribute } from '../../products/entities/product-variant-attribute.entity.js';

@Entity('attribute_values')
@Index(['legacyTable', 'legacyId'], { unique: true })
@Index(['attributeId', 'slug'], { unique: true })
export class AttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  attributeId: string | null;

  @Column({ type: 'varchar', length: 200 })
  value: string;

  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Attribute', 'values', { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute | null;

  @OneToMany('ProductVariantAttribute', 'attributeValue')
  variantAttributes: ProductVariantAttribute[];
}
