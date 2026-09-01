import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  findValidToken(userId: string, tokenHash: string) {
    return this.repo.findOne({
      where: {
        userId,
        tokenHash,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  revoke(id: string) {
    return this.repo.update(id, { revoked: true });
  }

  create(data: Pick<RefreshToken, 'userId' | 'tokenHash' | 'expiresAt'>) {
    return this.repo.create(data);
  }

  save(token: RefreshToken) {
    return this.repo.save(token);
  }
}
