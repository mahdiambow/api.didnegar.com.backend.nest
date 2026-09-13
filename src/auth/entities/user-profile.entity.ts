import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, UpdateDateColumn } from 'typeorm';
import type { User } from './user.entity.js';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10, nullable: true })
  nationalCode: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('User', 'profile', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
