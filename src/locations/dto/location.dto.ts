import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListLocationsQueryDto extends PaginationQueryDto {}

export class ListStatesQueryDto extends ListLocationsQueryDto {
  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  countryId?: string;
}

export class ListCitiesQueryDto extends ListLocationsQueryDto {
  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  countryId?: string;

  @ApiPropertyOptional({ example: '01JEX000000000000000000030' })
  @IsOptional()
  @IsULID()
  stateId?: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class CreateCountryDto {
  @ApiProperty({ example: 'IR' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'ایران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateCountryDto {
  @ApiPropertyOptional({ example: 'IR' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ example: 'ایران' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class CreateStateDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  countryId: string;

  @ApiProperty({ example: 'TEH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  code: string;

  @ApiProperty({ example: 'تهران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateStateDto {
  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  countryId?: string;

  @ApiPropertyOptional({ example: 'TEH' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class CreateCityDto {
  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  countryId?: string;

  @ApiPropertyOptional({ example: '01JEX000000000000000000030' })
  @IsOptional()
  @IsULID()
  stateId?: string;

  @ApiProperty({ example: 'تهران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateCityDto {
  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  countryId?: string | null;

  @ApiPropertyOptional({ example: '01JEX000000000000000000030' })
  @IsOptional()
  @IsULID()
  stateId?: string | null;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
