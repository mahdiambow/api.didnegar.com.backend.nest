import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Country } from './country.entity.js';
import type { State } from './state.entity.js';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  countryId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  stateId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Country', 'cities', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'countryId' })
  country: Country | null;

  @ManyToOne('State', 'cities', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'stateId' })
  state: State | null;
}
