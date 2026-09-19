import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CreditService } from '../credit/credit.service.js';
import { TransactionService } from '../transactions/transaction.service.js';
import { Withdraw } from './entities/withdraw.entity.js';
import type { WithdrawStatus } from './entities/withdraw.entity.js';
import { WithdrawRepository } from './repositories/withdraw.repository.js';
import {
  toWithdrawItem,
  type CreateWithdrawDto,
  type ListWithdrawsQueryDto,
} from './dto/withdraw.dto.js';

@Injectable()
export class WithdrawsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly withdrawRepository: WithdrawRepository,
    private readonly creditService: CreditService,
    private readonly transactionService: TransactionService,
  ) {}

  async create(userId: string, dto: CreateWithdrawDto) {
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
          description: dto.description ?? 'درخواست برداشت از اعتبار',
        },
        manager,
      );

      return withdraw;
    });

    return toWithdrawItem(result);
  }

  async listPaged(query: ListWithdrawsQueryDto, userId?: string) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.withdrawRepository.findPaginated(
      offset,
      limit,
      {
        userId: userId ?? query.userId,
        status: query.status as WithdrawStatus | undefined,
      },
    );
    return paginatedList(items.map(toWithdrawItem), page, limit, total);
  }

  async review(withdrawId: string, action: 'approve' | 'reject') {
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

    return toWithdrawItem(result);
  }
}
