import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { CreditSourceType } from './credit-source-type.enum.js';
import { CreditLog } from './entities/credit-log.entity.js';
import { UserCredit } from './entities/user-credit.entity.js';

export type CreditTxMeta = {
  sourceId?: string | null;
};

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(UserCredit)
    private readonly credits: Repository<UserCredit>,
    @InjectRepository(CreditLog)
    private readonly logs: Repository<CreditLog>,
  ) {}

  async getBalance(userId: string): Promise<{
    amount: number;
    lockedAmount: number;
  }> {
    const wallet = await this.credits.findOneBy({ userId });
    return {
      amount: Number(wallet?.amount ?? 0),
      lockedAmount: Number(wallet?.lockedAmount ?? 0),
    };
  }

  /** Create the user's wallet at registration (amount/locked = 0); idempotent. */
  async init(userId: string, manager?: EntityManager): Promise<UserCredit> {
    return this.ensureWallet(userId, manager);
  }

  /** شارژ موجودی قابل‌خرج */
  async incrementTotalAmount(
    userId: string,
    amount: number,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<UserCredit> {
    return this.apply(userId, amount, CreditSourceType.IN, meta, manager);
  }

  /** کسر از موجودی قابل‌خرج */
  async decrementTotalAmount(
    userId: string,
    amount: number,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<UserCredit> {
    return this.apply(userId, amount, CreditSourceType.OUT, meta, manager);
  }

  /** قفل کردن مبلغ از موجودی قابل‌خرج */
  async lock(
    userId: string,
    amount: number,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<UserCredit> {
    return this.apply(userId, amount, CreditSourceType.LOCK, meta, manager);
  }

  /** آزاد کردن مبلغ قفل‌شده به موجودی قابل‌خرج */
  async unlock(
    userId: string,
    amount: number,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<UserCredit> {
    return this.apply(userId, amount, CreditSourceType.UNLOCK, meta, manager);
  }

  private async apply(
    userId: string,
    amount: number,
    sourceType: CreditSourceType,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<UserCredit> {
    this.assertPositiveWholeAmount(amount);
    const wallet = await this.ensureWallet(userId, manager);
    const amountBefore = Number(wallet.amount);
    const lockedBefore = Number(wallet.lockedAmount);

    let qb = manager
      .createQueryBuilder()
      .update(UserCredit)
      .where('id = :id', { id: wallet.id })
      .setParameters({ amount });

    switch (sourceType) {
      case CreditSourceType.IN:
        qb = qb.set({ amount: () => '`amount` + :amount' });
        break;
      case CreditSourceType.OUT:
        qb = qb
          .set({ amount: () => '`amount` - :amount' })
          .andWhere('`amount` >= :amount');
        break;
      case CreditSourceType.LOCK:
        qb = qb
          .set({
            amount: () => '`amount` - :amount',
            lockedAmount: () => '`lockedAmount` + :amount',
          })
          .andWhere('`amount` >= :amount');
        break;
      case CreditSourceType.UNLOCK:
        qb = qb
          .set({
            amount: () => '`amount` + :amount',
            lockedAmount: () => '`lockedAmount` - :amount',
          })
          .andWhere('`lockedAmount` >= :amount');
        break;
    }

    const result = await qb.execute();
    if (
      (sourceType === CreditSourceType.OUT ||
        sourceType === CreditSourceType.LOCK ||
        sourceType === CreditSourceType.UNLOCK) &&
      (result.affected ?? 0) === 0
    ) {
      throw new ApiException(
        sourceType === CreditSourceType.UNLOCK
          ? 'INSUFFICIENT_LOCKED_CREDIT'
          : 'INSUFFICIENT_CREDIT',
        sourceType === CreditSourceType.UNLOCK
          ? 'مبلغ قفل‌شده کافی نیست'
          : 'موجودی کیف پول کافی نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await manager.getRepository(UserCredit).findOneByOrFail({
      id: wallet.id,
    });

    await manager.getRepository(CreditLog).save(
      manager.getRepository(CreditLog).create({
        userId,
        amount,
        sourceType,
        sourceId: meta.sourceId ?? null,
        amountBefore,
        amountAfter: Number(updated.amount),
        lockedBefore,
        lockedAfter: Number(updated.lockedAmount),
      }),
    );

    return updated;
  }

  private async ensureWallet(
    userId: string,
    manager?: EntityManager,
  ): Promise<UserCredit> {
    const creditsRepo = manager ? manager.getRepository(UserCredit) : this.credits;
    const existing = await creditsRepo.findOneBy({ userId });
    if (existing) return existing;

    try {
      return await creditsRepo.save(
        creditsRepo.create({ userId, amount: 0, lockedAmount: 0 }),
      );
    } catch {
      const again = await creditsRepo.findOneBy({ userId });
      if (again) return again;
      throw new ApiException(
        'CREDIT_WALLET_ERROR',
        'ساخت کیف پول ناموفق بود',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private assertPositiveWholeAmount(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new ApiException(
        'INVALID_CREDIT_AMOUNT',
        'مبلغ اعتبار باید عدد صحیح مثبت باشد',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
