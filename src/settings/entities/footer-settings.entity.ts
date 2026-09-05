import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('footer_settings')
@Check('CHK_footer_settings_singleton', '"id" = 1')
export class FooterSettings {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 50 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'varchar', length: 500 })
  workingHours: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  whatsapp: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  telegram: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  bale: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  rubika: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
