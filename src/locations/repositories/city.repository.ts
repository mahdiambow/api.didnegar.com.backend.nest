import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../entities/city.entity.js';

@Injectable()
export class CityRepository {
  constructor(
    @InjectRepository(City) private readonly repo: Repository<City>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { country: true, state: true },
    });
  }

  findByStateAndName(stateId: string, name: string) {
    return this.repo.findOne({ where: { stateId, name } });
  }

  findPaginated(
    offset: number,
    limit: number,
    filters: { countryId?: string; stateId?: string; name?: string },
  ) {
    const qb = this.repo
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.country', 'country')
      .leftJoinAndSelect('city.state', 'state')
      .orderBy('city.name', 'ASC')
      .skip(offset)
      .take(limit);

    if (filters.countryId) {
      qb.andWhere('city.countryId = :countryId', {
        countryId: filters.countryId,
      });
    }

    if (filters.stateId) {
      qb.andWhere('city.stateId = :stateId', { stateId: filters.stateId });
    }

    if (filters.name) {
      qb.andWhere('city.name ILIKE :name', { name: `%${filters.name}%` });
    }

    return qb.getManyAndCount();
  }

  create(data: Partial<City>) {
    return this.repo.create(data);
  }

  save(entity: City) {
    return this.repo.save(entity);
  }

  remove(entity: City) {
    return this.repo.remove(entity);
  }
}
