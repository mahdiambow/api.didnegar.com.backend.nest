import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { City } from '../../locations/entities/city.entity.js';
import type { Country } from '../../locations/entities/country.entity.js';
import type { State } from '../../locations/entities/state.entity.js';
import type { User } from '../../users/entities/user.entity.js';

/** Legacy order customer record, retained independently from the user account. */
@Entity('customers')
@Index(['legacyTable', 'legacyId'], { unique: true })
export class Customer {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'bigint' })
  legacyId: number;

  @Column({ type: 'varchar', length: 255 })
  legacyTable: string;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  countryId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  cityId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  stateId: string | null;

  @CreateDateColumn({ nullable: true })
  createdAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastActiveAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne('Country', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'countryId' })
  country: Country | null;

  @ManyToOne('State', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stateId' })
  state: State | null;

  @ManyToOne('City', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cityId' })
  city: City | null;
}
