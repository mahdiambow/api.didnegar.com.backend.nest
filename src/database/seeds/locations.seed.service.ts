import { Injectable } from '@nestjs/common';
import { CountryRepository } from '../../locations/repositories/country.repository.js';
import { StateRepository } from '../../locations/repositories/state.repository.js';
import { CityRepository } from '../../locations/repositories/city.repository.js';

@Injectable()
export class LocationsSeedService {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly stateRepository: StateRepository,
    private readonly cityRepository: CityRepository,
  ) {}

  async seed() {
    let country = await this.countryRepository.findByCode('IR');
    if (!country) {
      country = await this.countryRepository.save(
        this.countryRepository.create({
          code: 'IR',
          name: 'ایران',
        }),
      );
    }

    let state = await this.stateRepository.findByCountryAndCode(
      country.id,
      'TEH',
    );
    if (!state) {
      state = await this.stateRepository.save(
        this.stateRepository.create({
          countryId: country.id,
          code: 'TEH',
          name: 'تهران',
        }),
      );
    }

    const existingCity = await this.cityRepository.findByStateAndName(
      state.id,
      'تهران',
    );
    if (!existingCity) {
      await this.cityRepository.save(
        this.cityRepository.create({
          countryId: country.id,
          stateId: state.id,
          name: 'تهران',
        }),
      );
    }
  }
}
