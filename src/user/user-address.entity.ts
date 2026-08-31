import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  title: string; // عنوان آدرس (خانه، محل کار و ...)

  @Column({ type: 'varchar', length: 100 })
  province: string; // استان

  @Column({ type: 'varchar', length: 100 })
  city: string; // شهر

  @Column({ type: 'text' })
  addressDetail: string; // آدرس دقیق پستی

  @Column({ type: 'varchar', length: 10 })
  postalCode: string; // کد پستی

  @Column({ type: 'varchar', length: 20, nullable: true })
  plaque: string | null; // پلاک

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null; // واحد (اختیاری)

  @Column({ type: 'text', nullable: true })
  description: string | null; // توضیحات تکمیلی

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  long: number | null;

  @Column({ type: 'varchar', length: 150 })
  recipientFullName: string; // نام و نام‌خانوادگی تحویل‌گیرنده

  @Column({ type: 'varchar', length: 20 })
  recipientPhone: string; // شماره تماس تحویل‌گیرنده

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
