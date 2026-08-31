import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { UserProfile } from './user-profile.entity';
import { UserAddress } from './user-address.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // فیلدهای مربوط به مهاجرت از سیستم قدیمی
  @Column({ type: 'bigint', nullable: true })
  legacyId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  legacyTable: string | null;

  // شماره موبایل به عنوان نام کاربری استفاده می‌شود
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  username: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  password: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // نقش کاربر برای برگرداندن در validateToken
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // فیلدهای OTP - در صورت استفاده از Redis می‌توان این دو فیلد را حذف کرد
  @Column({ type: 'varchar', length: 6, nullable: true, select: false })
  otpCode: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  otpExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => UserAddress, (address) => address.user)
  addresses: UserAddress[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
