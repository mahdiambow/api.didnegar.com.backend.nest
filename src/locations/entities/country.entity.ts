import { PrimaryColumn, Column, CreateDateColumn, Entity, Index, OneToMany } from 'typeorm';
import type { State } from './state.entity.js';
import type { City } from './city.entity.js';

@Entity('countries')
export class Country {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany('State', 'country')
  states: State[];

  @OneToMany('City', 'country')
  cities: City[];
}
