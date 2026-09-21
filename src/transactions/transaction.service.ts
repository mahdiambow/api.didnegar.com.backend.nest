import { Injectable } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity.js';
import type {
  TransactionSourceType,
  TransactionState,
  TransactionType,
  TransactionUserType,
} from './entities/transaction.types.js';

export type AddTransactionInput = {
  userId: string;
  amount: number;
  type: TransactionType;
  sourceType: TransactionSourceType;
  sourceId?: string | null;
  state?: TransactionState;
  userType?: TransactionUserType;
  orderId?: string | null;
  description?: string | null;
};

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
  ) {}

  async addTransaction(
    input: AddTransactionInput,
    manager?: EntityManager,
  ): Promise<Transaction> {
    const [created] = await this.addTransactions([input], manager);
    return created;
  }

  async addTransactions(
    inputs: AddTransactionInput[],
    manager?: EntityManager,
  ): Promise<Transaction[]> {
    if (!inputs.length) return [];
    const repo = manager
      ? manager.getRepository(Transaction)
      : this.transactions;

    const entities = inputs.map((input) =>
      repo.create({
        userId: input.userId,
        amount: input.amount,
        type: input.type,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        state: input.state ?? 'pending',
        userType: input.userType ?? 'user',
        orderId: input.orderId ?? null,
        description: input.description ?? null,
      }),
    );

    return repo.save(entities);
  }

  async deleteTransactions(
    ids: string[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!ids.length) return;
    const repo = manager
      ? manager.getRepository(Transaction)
      : this.transactions;
    await repo.delete({ id: In(ids) });
  }

  /** فقط state قابل تغییر است */
  async updateTransactions(
    ids: string[],
    state: TransactionState,
    manager?: EntityManager,
  ): Promise<void> {
    if (!ids.length) return;
    const repo = manager
      ? manager.getRepository(Transaction)
      : this.transactions;
    await repo.update({ id: In(ids) }, { state });
  }

  findPendingBySourceId(sourceId: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Transaction)
      : this.transactions;
    return repo.findOne({
      where: { sourceId, state: 'pending' },
    });
  }

  findPendingBySource(
    sourceId: string,
    sourceType: TransactionSourceType,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(Transaction)
      : this.transactions;
    return repo.findOne({
      where: { sourceId, sourceType, state: 'pending' },
    });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: {
      userId?: string;
      state?: TransactionState;
      sourceType?: TransactionSourceType;
      orderId?: string;
    } = {},
  ): Promise<[Transaction[], number]> {
    const qb = this.transactions
      .createQueryBuilder('tx')
      .orderBy('tx.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (filters.userId) {
      qb.andWhere('tx.userId = :userId', { userId: filters.userId });
    }
    if (filters.state) {
      qb.andWhere('tx.state = :state', { state: filters.state });
    }
    if (filters.sourceType) {
      qb.andWhere('tx.sourceType = :sourceType', {
        sourceType: filters.sourceType,
      });
    }
    if (filters.orderId) {
      qb.andWhere('tx.orderId = :orderId', { orderId: filters.orderId });
    }

    return qb.getManyAndCount();
  }
}
