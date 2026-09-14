import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { SellerOffer } from '../../offers/entities/seller-offer.entity.js';
import type { ShoppingCart } from './shopping-cart.entity.js';

@Entity('shopping_cart_items')
@Unique(['cartId', 'offerId'])
@Check('CHK_shopping_cart_item_quantity', '`quantity` > 0')
export class ShoppingCartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  cartId: string;

  @Index()
  @Column({ type: 'uuid' })
  offerId: string;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne('ShoppingCart', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: ShoppingCart;

  @ManyToOne('SellerOffer', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'offerId' })
  offer: SellerOffer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
