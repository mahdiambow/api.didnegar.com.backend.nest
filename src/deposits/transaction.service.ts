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
}
