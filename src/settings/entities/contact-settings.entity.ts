import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contact_settings')
@Check('CHK_contact_settings_singleton', '"id" = 1')
export class ContactSettings {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 50 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 500 })
  workingHours: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
