import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Country } from './country.entity.js';
import type { City } from './city.entity.js';

@Entity('states')
@Index(['countryId', 'code'], { unique: true })
export class State {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 26 })
  countryId: string;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Country', 'states', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @OneToMany('City', 'state')
  cities: City[];
}
