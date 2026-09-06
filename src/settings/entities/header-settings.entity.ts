import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('header_settings')
@Check('CHK_header_settings_singleton', '"id" = 1')
export class HeaderSettings {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null;

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
