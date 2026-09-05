import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Category } from '../../categories/entities/category.entity.js';
import type { BannerItemDto } from '../dto/banner.dto.js';
import { BannerPage, BannerSection } from '../types/banner.enums.js';

@Entity('banners')
@Index('UQ_banners_home_section', ['section'], {
  unique: true,
  where: '"page" = \'home\'',
})
@Index('UQ_banners_category_section', ['categoryId', 'section'], {
  unique: true,
  where: '"page" = \'category_sidebar\'',
})
@Check(
  'CHK_banners_placement',
  `("page" = 'home' AND "categoryId" IS NULL AND "section" IN ('main_slider', 'three_images', 'narrow_banner', 'video', 'two_images', 'single_banner')) OR ("page" = 'category_sidebar' AND "categoryId" IS NOT NULL AND "section" = 'sidebar')`,
)
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  page: BannerPage;

  @Column({ type: 'varchar', length: 30 })
  section: BannerSection;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne('Category', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ type: 'jsonb' })
  items: BannerItemDto[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
