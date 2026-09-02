import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CountryRepository } from './repositories/country.repository.js';
import { StateRepository } from './repositories/state.repository.js';
import { CityRepository } from './repositories/city.repository.js';
import {
  CreateCountryDto,
  CreateStateDto,
  CreateCityDto,
  UpdateCountryDto,
  UpdateStateDto,
  UpdateCityDto,
  ListLocationsQueryDto,
  ListStatesQueryDto,
  ListCitiesQueryDto,
} from './dto/location.dto.js';
import {
  toCityResponse,
  toCountryResponse,
  toStateResponse,
} from './dto/location-response.dto.js';

@Injectable()
export class CountriesService {
  constructor(private readonly countryRepository: CountryRepository) {}

  findAll(query: ListLocationsQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    return this.countryRepository
      .findPaginated(offset, limit)
      .then(([items, total]) =>
        paginatedList(items.map(toCountryResponse), page, limit, total),
      );
  }

  async findOne(id: string) {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new ApiException(
        'COUNTRY_NOT_FOUND',
        'کشور یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toCountryResponse(country);
  }

  async create(dto: CreateCountryDto) {
    const existing = await this.countryRepository.findByCode(dto.code);
    if (existing) {
      throw new ApiException(
        'COUNTRY_ALREADY_EXISTS',
        'کشور با این code از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const country = await this.countryRepository.save(
      this.countryRepository.create(dto),
    );
    return toCountryResponse(country);
  }

  async update(id: string, dto: UpdateCountryDto) {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new ApiException(
        'COUNTRY_NOT_FOUND',
        'کشور یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.code && dto.code !== country.code) {
      const codeTaken = await this.countryRepository.findByCode(dto.code);
      if (codeTaken) {
        throw new ApiException(
          'COUNTRY_ALREADY_EXISTS',
          'کشور با این code از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(country, dto);
    const updated = await this.countryRepository.save(country);
    return toCountryResponse(updated);
  }

  async remove(id: string) {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new ApiException(
        'COUNTRY_NOT_FOUND',
        'کشور یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.countryRepository.remove(country);
    return {};
  }
}

@Injectable()
export class StatesService {
  constructor(
    private readonly stateRepository: StateRepository,
    private readonly countryRepository: CountryRepository,
  ) {}

  findAll(query: ListStatesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    return this.stateRepository
      .findPaginated(offset, limit, { countryId: query.countryId })
      .then(([items, total]) =>
        paginatedList(
          items.map((item) => toStateResponse(item, true)),
          page,
          limit,
          total,
        ),
      );
  }

  async findOne(id: string) {
    const state = await this.stateRepository.findById(id);
    if (!state) {
      throw new ApiException(
        'STATE_NOT_FOUND',
        'استان یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toStateResponse(state, true);
  }

  async create(dto: CreateStateDto) {
    await this.ensureCountryExists(dto.countryId);

    const existing = await this.stateRepository.findByCountryAndCode(
      dto.countryId,
      dto.code,
    );
    if (existing) {
      throw new ApiException(
        'STATE_ALREADY_EXISTS',
        'استان با این code در این کشور از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const state = await this.stateRepository.save(
      this.stateRepository.create(dto),
    );
    const loaded = await this.stateRepository.findById(state.id);
    return toStateResponse(loaded!, true);
  }

  async update(id: string, dto: UpdateStateDto) {
    const state = await this.stateRepository.findById(id);
    if (!state) {
      throw new ApiException(
        'STATE_NOT_FOUND',
        'استان یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const countryId = dto.countryId ?? state.countryId;
    const code = dto.code ?? state.code;

    if (dto.countryId) {
      await this.ensureCountryExists(dto.countryId);
    }

    if (dto.code || dto.countryId) {
      const existing = await this.stateRepository.findByCountryAndCode(
        countryId,
        code,
      );
      if (existing && existing.id !== id) {
        throw new ApiException(
          'STATE_ALREADY_EXISTS',
          'استان با این code در این کشور از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(state, dto);
    const updated = await this.stateRepository.save(state);
    const loaded = await this.stateRepository.findById(updated.id);
    return toStateResponse(loaded!, true);
  }

  async remove(id: string) {
    const state = await this.stateRepository.findById(id);
    if (!state) {
      throw new ApiException(
        'STATE_NOT_FOUND',
        'استان یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.stateRepository.remove(state);
    return {};
  }

  private async ensureCountryExists(countryId: string) {
    const country = await this.countryRepository.findById(countryId);
    if (!country) {
      throw new ApiException(
        'COUNTRY_NOT_FOUND',
        'کشور یافت نشد',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

@Injectable()
export class CitiesService {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly countryRepository: CountryRepository,
    private readonly stateRepository: StateRepository,
  ) {}

  findAll(query: ListCitiesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    return this.cityRepository
      .findPaginated(offset, limit, {
        countryId: query.countryId,
        stateId: query.stateId,
        name: query.name,
      })
      .then(([items, total]) =>
        paginatedList(
          items.map((item) => toCityResponse(item, true)),
          page,
          limit,
          total,
        ),
      );
  }

  async findOne(id: string) {
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new ApiException(
        'CITY_NOT_FOUND',
        'شهر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toCityResponse(city, true);
  }

  async create(dto: CreateCityDto) {
    const countryId = dto.countryId ?? null;
    const stateId = dto.stateId ?? null;

    await this.validateRelations(countryId, stateId);

    const city = await this.cityRepository.save(
      this.cityRepository.create({
        countryId,
        stateId,
        name: dto.name,
      }),
    );
    const loaded = await this.cityRepository.findById(city.id);
    return toCityResponse(loaded!, true);
  }

  async update(id: string, dto: UpdateCityDto) {
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new ApiException(
        'CITY_NOT_FOUND',
        'شهر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const countryId =
      dto.countryId !== undefined ? dto.countryId : city.countryId;
    const stateId = dto.stateId !== undefined ? dto.stateId : city.stateId;

    await this.validateRelations(countryId, stateId);

    if (dto.countryId !== undefined) city.countryId = dto.countryId;
    if (dto.stateId !== undefined) city.stateId = dto.stateId;
    if (dto.name !== undefined) city.name = dto.name;

    const updated = await this.cityRepository.save(city);
    const loaded = await this.cityRepository.findById(updated.id);
    return toCityResponse(loaded!, true);
  }

  async remove(id: string) {
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new ApiException(
        'CITY_NOT_FOUND',
        'شهر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cityRepository.remove(city);
    return {};
  }

  private async validateRelations(
    countryId: string | null,
    stateId: string | null,
  ) {
    if (countryId) {
      const country = await this.countryRepository.findById(countryId);
      if (!country) {
        throw new ApiException(
          'COUNTRY_NOT_FOUND',
          'کشور یافت نشد',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (stateId) {
      const state = await this.stateRepository.findById(stateId);
      if (!state) {
        throw new ApiException(
          'STATE_NOT_FOUND',
          'استان یافت نشد',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (countryId && state.countryId !== countryId) {
        throw new ApiException(
          'CITY_STATE_COUNTRY_MISMATCH',
          'استان انتخاب‌شده متعلق به این کشور نیست',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
