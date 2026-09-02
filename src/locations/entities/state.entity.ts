import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Country } from './country.entity.js';
import type { City } from './city.entity.js';

@Entity('states')
@Index(['countryId', 'code'], { unique: true })
export class State {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
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
