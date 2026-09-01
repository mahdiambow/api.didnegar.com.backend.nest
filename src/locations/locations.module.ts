import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { Country } from './entities/country.entity.js';
import { State } from './entities/state.entity.js';
import { City } from './entities/city.entity.js';
import { CountryRepository } from './repositories/country.repository.js';
import { StateRepository } from './repositories/state.repository.js';
import { CityRepository } from './repositories/city.repository.js';
import {
  CitiesService,
  CountriesService,
  StatesService,
} from './locations.service.js';
import { CountriesController } from './countries.controller.js';
import { StatesController } from './states.controller.js';
import { CitiesController } from './cities.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Country, State, City]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  controllers: [CountriesController, StatesController, CitiesController],
  providers: [
    CountriesService,
    StatesService,
    CitiesService,
    CountryRepository,
    StateRepository,
    CityRepository,
  ],
  exports: [CountryRepository, StateRepository, CityRepository, TypeOrmModule],
})
export class LocationsModule {}
