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

@Entity('variant_attribute_values')
@Index(['variantId', 'attributeValueId'], { unique: true })
export class ProductVariantAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @Index()
  @Column({ name: 'attribute_value_id', type: 'uuid' })
  attributeValueId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('ProductVariant', 'variantAttributes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @ManyToOne('AttributeValue', 'variantAttributes', {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'attribute_value_id' })
  attributeValue: AttributeValue;
}
