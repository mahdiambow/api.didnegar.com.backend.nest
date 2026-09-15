import {
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';

@Entity('admins')
export class Admin {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('User', 'admin')
  users: User[];
}
