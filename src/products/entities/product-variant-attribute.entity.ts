import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { ProductVariant } from './product-variant.entity.js';
import type { AttributeValue } from '../../attributes/entities/attribute-value.entity.js';

@Entity('product_variant_attributes')
@Index(['variantId', 'attributeValueId'], { unique: true })
export class ProductVariantAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  variantId: string;

  @Index()
  @Column({ type: 'uuid' })
  attributeValueId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('ProductVariant', 'variantAttributes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @ManyToOne('AttributeValue', 'variantAttributes', {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'attributeValueId' })
  attributeValue: AttributeValue;
}
