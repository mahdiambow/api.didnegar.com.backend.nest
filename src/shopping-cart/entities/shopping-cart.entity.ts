import {
  CreateDateColumn,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import type { ShoppingCartItem } from './shopping-cart-item.entity.js';

@Entity('shopping_carts')
export class ShoppingCart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Declared separately so the user id is available without loading User.
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany('ShoppingCartItem', 'cart', { cascade: true })
  items: ShoppingCartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
