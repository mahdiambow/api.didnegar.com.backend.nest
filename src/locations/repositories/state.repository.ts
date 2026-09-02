import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State } from '../entities/state.entity.js';

@Injectable()
export class StateRepository {
  constructor(
    @InjectRepository(State) private readonly repo: Repository<State>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { country: true },
    });
  }

  findByCountryAndCode(countryId: string, code: string) {
    return this.repo.findOne({ where: { countryId, code } });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { countryId?: string },
  ) {
    const qb = this.repo
      .createQueryBuilder('state')
      .leftJoinAndSelect('state.country', 'country')
      .orderBy('state.name', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.countryId) {
      qb.andWhere('state.countryId = :countryId', {
        countryId: filters.countryId,
      });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<State>) {
    return this.repo.create(data);
  }

  save(entity: State) {
    return this.repo.save(entity);
  }

  remove(entity: State) {
    return this.repo.remove(entity);
  }
}
