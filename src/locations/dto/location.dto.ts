import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListLocationsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class ListStatesQueryDto extends ListLocationsQueryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}

export class ListCitiesQueryDto extends ListLocationsQueryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
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
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
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
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
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
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  stateId?: string;

  @ApiProperty({ example: 'تهران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateCityDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  countryId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  stateId?: string | null;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
