import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Role } from '../../roles/entities/role.entity.js';
import type { UserProfile } from './user-profile.entity.js';
import type { UserAddress } from './user-address.entity.js';
import type { RefreshToken } from './refresh-token.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  legacyTable: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  username: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  password: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'varchar', length: 72, nullable: true, select: false })
  otpCode: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  otpExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Role', 'users', { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToOne('UserProfile', 'user')
  profile: UserProfile;

  @OneToMany('UserAddress', 'user')
  addresses: UserAddress[];

  @OneToMany('RefreshToken', 'user')
  refreshTokens: RefreshToken[];
}
