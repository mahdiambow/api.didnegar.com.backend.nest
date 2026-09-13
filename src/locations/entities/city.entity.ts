import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Country } from './country.entity.js';
import type { State } from './state.entity.js';

@Entity('cities')
export class City {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
  countryId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 26, nullable: true })
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
