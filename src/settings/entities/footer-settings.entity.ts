import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export type FooterMenuSubLink = {
  title: string;
  url: string;
};

export type FooterMenuLink = {
  title: string;
  url: string;
  subMenu?: FooterMenuSubLink[];
};

export type FooterAboutUs = {
  title: string;
  text: string;
};

@Entity('footer_settings')
@Check('CHK_footer_settings_singleton', '`id` = 1')
export class FooterSettings {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  logoText: string | null;

  @Column({ type: 'json', default: [] })
  menuLinks: FooterMenuLink[];

  /** حداکثر ۴ URL اینماد / نشان اعتماد */
  @Column({ type: 'json', default: [] })
  enamadUrls: string[];

  @Column({ type: 'json', nullable: true })
  aboutUs: FooterAboutUs | null;

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
