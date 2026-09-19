import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CreditService } from '../credit/credit.service.js';
import { DepositsService } from '../deposits/deposits.service.js';
import { DepositRepository } from '../deposits/repositories/deposit.repository.js';
import { WithdrawRepository } from '../deposits/repositories/withdraw.repository.js';
import { Withdraw } from '../deposits/entities/withdraw.entity.js';
import { TransactionService } from '../deposits/transaction.service.js';
import type { DepositStatus } from '../deposits/entities/deposit.entity.js';
import type { WithdrawStatus } from '../deposits/entities/withdraw.entity.js';
import {
  toWalletDepositItem,
  toWalletWithdrawItem,
  type CreateWalletDepositDto,
  type CreateWalletWithdrawDto,
  type ListWalletQueryDto,
} from './dto/wallet.dto.js';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly creditService: CreditService,
    private readonly depositsService: DepositsService,
    private readonly depositRepository: DepositRepository,
    private readonly withdrawRepository: WithdrawRepository,
    private readonly transactionService: TransactionService,
  ) {}

  getBalance(userId: string) {
    return this.creditService.getBalance(userId);
  }

  createDeposit(userId: string, dto: CreateWalletDepositDto) {
    return this.depositsService.createWalletTopUp(
      userId,
      dto.amount,
      dto.method,
    );
  }

  async listMyDeposits(userId: string, query: ListWalletQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.depositRepository.findPaginated(
      offset,
      limit,
      {
        userId,
        status: query.status as DepositStatus | undefined,
      },
    );
    return paginatedList(items.map(toWalletDepositItem), page, limit, total);
  }

  async listDepositsAdmin(query: ListWalletQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.depositRepository.findPaginated(
      offset,
      limit,
      {
        userId: query.userId,
        status: query.status as DepositStatus | undefined,
      },
    );
    return paginatedList(items.map(toWalletDepositItem), page, limit, total);
  }

  async createWithdraw(userId: string, dto: CreateWalletWithdrawDto) {
    const amount = Math.round(Number(dto.amount));
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new ApiException(
        'INVALID_AMOUNT',
        'مبلغ برداشت باید عدد صحیح مثبت باشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const withdrawRepo = manager.getRepository(Withdraw);
      const withdraw = await withdrawRepo.save(
        withdrawRepo.create({
          userId,
          amount,
          status: 'pending',
          trackId: null,
          description: dto.description ?? null,
        }),
      );

      // قفل مبلغ تا تأیید ادمین
      await this.creditService.lock(
        userId,
        amount,
        { sourceId: withdraw.id },
        manager,
      );

      await this.transactionService.addTransaction(
        {
          userId,
          amount,
          type: 'debit',
          sourceType: 'WITHDRAW',
          sourceId: withdraw.id,
          state: 'pending',
          description: dto.description ?? 'درخواست برداشت از کیف پول',
        },
        manager,
      );

      return withdraw;
    });

    return toWalletWithdrawItem(result);
  }

  async listMyWithdraws(userId: string, query: ListWalletQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.withdrawRepository.findPaginated(
      offset,
      limit,
      {
        userId,
        status: query.status as WithdrawStatus | undefined,
      },
    );
    return paginatedList(items.map(toWalletWithdrawItem), page, limit, total);
  }

  async listWithdrawsAdmin(query: ListWalletQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.withdrawRepository.findPaginated(
      offset,
      limit,
      {
        userId: query.userId,
        status: query.status as WithdrawStatus | undefined,
      },
    );
    return paginatedList(items.map(toWalletWithdrawItem), page, limit, total);
  }

  async reviewWithdraw(
    withdrawId: string,
    action: 'approve' | 'reject',
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const withdrawRepo = manager.getRepository(Withdraw);
      const withdraw = await withdrawRepo.findOne({
        where: { id: withdrawId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!withdraw) {
        throw new ApiException(
          'WITHDRAW_NOT_FOUND',
          'درخواست برداشت یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }
      if (withdraw.status !== 'pending') {
        throw new ApiException(
          'WITHDRAW_NOT_PENDING',
          'این درخواست قابل بررسی نیست',
          HttpStatus.CONFLICT,
        );
      }

      const amount = Number(withdraw.amount);
      const pendingTx = await this.transactionService.findPendingBySourceId(
        withdraw.id,
        manager,
      );

      if (action === 'approve') {
        // آزاد از قفل و کسر قطعی
        await this.creditService.unlock(
          withdraw.userId,
          amount,
          { sourceId: withdraw.id },
          manager,
        );
        await this.creditService.decrementTotalAmount(
          withdraw.userId,
          amount,
          { sourceId: withdraw.id },
          manager,
        );
        withdraw.status = 'success';
        if (pendingTx) {
          await this.transactionService.updateTransactions(
            [pendingTx.id],
            'executed',
            manager,
          );
        }
      } else {
        await this.creditService.unlock(
          withdraw.userId,
          amount,
          { sourceId: withdraw.id },
          manager,
        );
        withdraw.status = 'rejected';
        if (pendingTx) {
          await this.transactionService.updateTransactions(
            [pendingTx.id],
            'rejected',
            manager,
          );
        }
      }

      return withdrawRepo.save(withdraw);
    });

    return toWalletWithdrawItem(result);
  }
}
