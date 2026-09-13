import { PrimaryColumn, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import type { User } from '../../auth/entities/user.entity.js';
import type { Seller } from '../../sellers/entities/seller.entity.js';

@Entity('roles')
export class Role {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'json', default: [] })
  permissions: string[];

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'varchar', length: 26, nullable: true })
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
