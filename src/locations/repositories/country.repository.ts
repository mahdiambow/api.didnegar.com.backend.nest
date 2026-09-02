import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../entities/country.entity.js';

@Injectable()
export class CountryRepository {
  constructor(
    @InjectRepository(Country) private readonly repo: Repository<Country>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string) {
    return this.repo.findOne({ where: { code } });
  }

  findPaginated(offset: number, limit: number) {
    return this.repo
      .createQueryBuilder('country')
      .orderBy('country.name', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  create(data: Partial<Country>) {
    return this.repo.create(data);
  }

  save(entity: Country) {
    return this.repo.save(entity);
  }

  remove(entity: Country) {
    return this.repo.remove(entity);
  }
}
