import {
  PrimaryColumn,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
} from 'typeorm';
import type { BannerItemDto } from '../dto/banner.dto.js';
import { BannerPage, BannerSection } from '../types/banner.enums.js';

@Entity('banners')
@Check(
  'CHK_banners_placement',
  "(`page` = 'home' AND `section` IN ('main_slider', 'three_images', 'narrow_banner', 'video', 'two_images', 'single_banner')) OR (`page` = 'category_sidebar' AND `section` = 'sidebar')",
)
export class Banner {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 30 })
  page: BannerPage;

  @Column({ type: 'varchar', length: 30 })
  section: BannerSection;

  @Column({ type: 'json' })
  items: BannerItemDto[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
