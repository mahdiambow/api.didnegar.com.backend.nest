import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { CreditLedger } from './entities/credit-ledger.entity.js';
import { UserCredit } from './entities/user-credit.entity.js';

export type CreditTxMeta = {
  reason: string;
  orderId?: string | null;
  paymentId?: string | null;
};

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(UserCredit)
    private readonly credits: Repository<UserCredit>,
    @InjectRepository(CreditLedger)
    private readonly ledger: Repository<CreditLedger>,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.credits.findOneBy({ userId });
    return Number(wallet?.balance ?? 0);
  }

  /** شارژ کیف پول (مثلاً بعد از موفقیت درگاه) */
  async deposit(
    userId: string,
    amount: number,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<number> {
    this.assertPositiveAmount(amount);
    const wallet = await this.ensureWallet(userId, manager);

    await manager
      .createQueryBuilder()
      .update(UserCredit)
      .set({ balance: () => '`balance` + :amount' })
      .where('id = :id', { id: wallet.id })
      .setParameters({ amount })
      .execute();

    const updated = await manager.getRepository(UserCredit).findOneByOrFail({
      id: wallet.id,
    });
    const balanceAfter = Number(updated.balance);

    await manager.getRepository(CreditLedger).save(
      manager.getRepository(CreditLedger).create({
        userId,
        amount,
        type: 'deposit',
        reason: meta.reason,
        orderId: meta.orderId ?? null,
        paymentId: meta.paymentId ?? null,
        balanceAfter,
      }),
    );

    return balanceAfter;
  }

  /** کسر از کیف پول — فقط اگر موجودی کافی باشد (اتمیک) */
  async charge(
    userId: string,
    amount: number,
    meta: CreditTxMeta,
    manager: EntityManager,
  ): Promise<number> {
    this.assertPositiveAmount(amount);
    const wallet = await this.ensureWallet(userId, manager);

    const result = await manager
      .createQueryBuilder()
      .update(UserCredit)
      .set({ balance: () => '`balance` - :amount' })
      .where('id = :id', { id: wallet.id })
      .andWhere('`balance` >= :amount')
      .setParameters({ amount })
      .execute();

    if ((result.affected ?? 0) === 0) {
      throw new ApiException(
        'INSUFFICIENT_CREDIT',
        'موجودی کیف پول کافی نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await manager.getRepository(UserCredit).findOneByOrFail({
      id: wallet.id,
    });
    const balanceAfter = Number(updated.balance);

    await manager.getRepository(CreditLedger).save(
      manager.getRepository(CreditLedger).create({
        userId,
        amount,
        type: 'charge',
        reason: meta.reason,
        orderId: meta.orderId ?? null,
        paymentId: meta.paymentId ?? null,
        balanceAfter,
      }),
    );

    return balanceAfter;
  }

  /**
   * مسیر یکپارچه پرداخت سفارش از طریق credit:
   * ابتدا deposit (اگر مبلغ خارجی آمده) سپس charge.
   * برای پرداخت مستقیم با کیف پول فقط charge می‌زند.
   */
  async payOrderViaCredit(
    userId: string,
    amount: number,
    meta: CreditTxMeta & { depositFromGateway?: boolean },
    manager: EntityManager,
  ): Promise<{ balanceAfter: number }> {
    if (meta.depositFromGateway) {
      await this.deposit(userId, amount, {
        reason: meta.reason ? `${meta.reason}:deposit` : 'gateway_topup',
        orderId: meta.orderId,
        paymentId: meta.paymentId,
      }, manager);
    }

    const balanceAfter = await this.charge(userId, amount, {
      reason: meta.reason ? `${meta.reason}:charge` : 'order_payment',
      orderId: meta.orderId,
      paymentId: meta.paymentId,
    }, manager);

    return { balanceAfter };
  }

  private async ensureWallet(
    userId: string,
    manager: EntityManager,
  ): Promise<UserCredit> {
    const repo = manager.getRepository(UserCredit);
    const existing = await repo.findOneBy({ userId });
    if (existing) return existing;

    try {
      return await repo.save(repo.create({ userId, balance: 0 }));
    } catch {
      const again = await repo.findOneBy({ userId });
      if (again) return again;
      throw new ApiException(
        'CREDIT_WALLET_ERROR',
        'ساخت کیف پول ناموفق بود',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private assertPositiveAmount(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiException(
        'INVALID_CREDIT_AMOUNT',
        'مبلغ اعتبار نامعتبر است',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
