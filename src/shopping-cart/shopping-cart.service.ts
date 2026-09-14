import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { OffersService, toOfferResponse } from '../offers/offers.service.js';
import { AddShoppingCartItemDto, UpdateShoppingCartItemDto } from './dto/shopping-cart.dto.js';
import { ShoppingCartItem } from './entities/shopping-cart-item.entity.js';
import { ShoppingCart } from './entities/shopping-cart.entity.js';

@Injectable()
export class ShoppingCartService {
  constructor(
    @InjectRepository(ShoppingCart)
    private readonly carts: Repository<ShoppingCart>,
    @InjectRepository(ShoppingCartItem)
    private readonly items: Repository<ShoppingCartItem>,
    private readonly offersService: OffersService,
  ) {}

  async get(userId: string) {
    const cart = await this.init(userId);
    return this.toResponse(await this.loadCart(cart.id));
  }

  /** Create the user's cart at registration time; safe to call repeatedly. */
  async init(userId: string, manager?: EntityManager): Promise<ShoppingCart> {
    return this.getOrCreate(userId, manager);
  }

  async addItem(userId: string, dto: AddShoppingCartItemDto) {
    const cart = await this.init(userId);
    const existing = await this.items.findOne({
      where: { cartId: cart.id, offerId: dto.offerId },
    });
    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    await this.offersService.resolvePurchasable(dto.offerId, quantity);

    if (existing) {
      existing.quantity = quantity;
      await this.items.save(existing);
    } else {
      await this.items.save(
        this.items.create({ cartId: cart.id, offerId: dto.offerId, quantity }),
      );
    }
    return this.toResponse(await this.loadCart(cart.id));
  }

  async updateItem(userId: string, itemId: string, dto: UpdateShoppingCartItemDto) {
    const item = await this.findUserItem(userId, itemId);
    await this.offersService.resolvePurchasable(item.offerId, dto.quantity);
    item.quantity = dto.quantity;
    await this.items.save(item);
    return this.toResponse(await this.loadCart(item.cartId));
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.findUserItem(userId, itemId);
    await this.items.remove(item);
    return this.toResponse(await this.loadCart(item.cartId));
  }

  async clear(userId: string) {
    const cart = await this.init(userId);
    await this.items.delete({ cartId: cart.id });
    return this.toResponse(await this.loadCart(cart.id));
  }

  private async getOrCreate(
    userId: string,
    manager?: EntityManager,
  ): Promise<ShoppingCart> {
    const carts = manager ? manager.getRepository(ShoppingCart) : this.carts;
    const existing = await carts.findOneBy({ userId });
    if (existing) return existing;
    try {
      return await carts.save(carts.create({ userId }));
    } catch (error) {
      const cart = await carts.findOneBy({ userId });
      if (cart) return cart;
      throw error;
    }
  }

  private async loadCart(id: string): Promise<ShoppingCart> {
    return (await this.carts.findOneOrFail({
      where: { id },
      relations: { items: { offer: true } },
      order: { items: { createdAt: 'ASC' } },
    }));
  }

  private async findUserItem(userId: string, itemId: string) {
    const item = await this.items
      .createQueryBuilder('item')
      .innerJoin('item.cart', 'cart')
      .where('item.id = :itemId', { itemId })
      .andWhere('cart.userId = :userId', { userId })
      .getOne();
    if (!item) {
      throw new ApiException(
        'CART_ITEM_NOT_FOUND',
        'آیتم سبد خرید یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return item;
  }

  private toResponse(cart: ShoppingCart) {
    const items = cart.items.map((item) => {
      const unitPrice = Number(item.offer.price);
      return {
        id: item.id,
        offerId: item.offerId,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
        offer: toOfferResponse(item.offer),
      };
    });
    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
