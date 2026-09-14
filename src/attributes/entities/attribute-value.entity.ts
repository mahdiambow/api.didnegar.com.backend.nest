import {
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import type { Attribute } from './attribute.entity.js';

@Entity('attribute_values')
@Index(['legacyTable', 'legacyId'], { unique: true })
@Index(['attributeId', 'value'], { unique: true })
export class AttributeValue {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  attributeId: string;

  @Column({ type: 'varchar', length: 200 })
  value: string;

  @Column({ type: 'varchar', length: 200 })
  label: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Attribute', 'values', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;
}
