import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Country } from '../entities/country.entity.js';
import { State } from '../entities/state.entity.js';
import { City } from '../entities/city.entity.js';

export class CountryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;
}

export class StateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  countryId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: CountryResponseDto })
  country?: CountryResponseDto;
}

export class CityResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  countryId: string | null;

  @ApiPropertyOptional({ nullable: true })
  stateId: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: CountryResponseDto, nullable: true })
  country?: CountryResponseDto | null;

  @ApiPropertyOptional({ type: StateResponseDto, nullable: true })
  state?: StateResponseDto | null;
}

export function toCountryResponse(country: Country): CountryResponseDto {
  return {
    id: country.id,
    code: country.code,
    name: country.name,
    createdAt: country.createdAt,
  };
}

export function toStateResponse(
  state: State,
  includeCountry = false,
): StateResponseDto {
  return {
    id: state.id,
    countryId: state.countryId,
    code: state.code,
    name: state.name,
    createdAt: state.createdAt,
    country:
      includeCountry && state.country
        ? toCountryResponse(state.country)
        : undefined,
  };
}

export function toCityResponse(city: City, populate = false): CityResponseDto {
  return {
    id: city.id,
    countryId: city.countryId,
    stateId: city.stateId,
    name: city.name,
    createdAt: city.createdAt,
    country:
      populate && city.country
        ? toCountryResponse(city.country)
        : undefined,
    state:
      populate && city.state ? toStateResponse(city.state) : undefined,
  };
}
