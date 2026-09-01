import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { User } from '../../auth/entities/user.entity.js';
import type { Seller } from '../../sellers/entities/seller.entity.js';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index(['slug', 'sellerId'], { unique: true })
  @Column({ type: 'varchar', length: 50 })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', array: true, default: '{}' })
  permissions: string[];

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'uuid', nullable: true })
  sellerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('User', 'role')
  users: User[];

  @ManyToOne('Seller', 'roles', { nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller | null;
}
