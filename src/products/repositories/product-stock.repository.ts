import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ProductStock } from '../entities/product-stock.entity.js';

/**
 * موجودی جدا از products نگه داشته می‌شود تا:
 * - خواندن/مشاهده محصول قفل نشود
 * - خرید فقط ردیف کوتاه‌عمر product_stocks را با UPDATE اتمیک درگیر کند
 *   (نه Lock کل product برای چند ثانیه پردازش سفارش)
 */
@Injectable()
export class ProductStockRepository {
  constructor(
    @InjectRepository(ProductStock)
    private readonly repo: Repository<ProductStock>,
  ) {}

  private stocks(manager?: EntityManager) {
    return manager ? manager.getRepository(ProductStock) : this.repo;
  }

  findByProductId(productId: string, manager?: EntityManager) {
    return this.stocks(manager).findOne({ where: { productId } });
  }

  create(data: Partial<ProductStock>, manager?: EntityManager) {
    return this.stocks(manager).create(data);
  }

  save(entity: ProductStock, manager?: EntityManager) {
    return this.stocks(manager).save(entity);
  }

  async upsertForProduct(
    productId: string,
    stock: number,
    manager?: EntityManager,
  ) {
    const existing = await this.findByProductId(productId, manager);
    if (existing) {
      existing.stock = stock;
      return this.save(existing, manager);
    }
    return this.save(this.create({ productId, stock }, manager), manager);
  }

  /** کم‌کردن اتمیک موجودی — فقط ردیف stock، بدون لاک روی products */
  async tryDecrement(
    productId: string,
    quantity: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    if (!Number.isInteger(quantity) || quantity < 1) return false;

    const result = await this.stocks(manager)
      .createQueryBuilder()
      .update(ProductStock)
      .set({ stock: () => '`stock` - :quantity' })
      .where('`productId` = :productId')
      .andWhere('`stock` >= :quantity')
      .setParameters({ productId, quantity })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async tryIncrement(
    productId: string,
    quantity: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    if (!Number.isInteger(quantity) || quantity < 1) return false;

    const result = await this.stocks(manager)
      .createQueryBuilder()
      .update(ProductStock)
      .set({ stock: () => '`stock` + :quantity' })
      .where('`productId` = :productId')
      .setParameters({ productId, quantity })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
