import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateContactSettingsDto {
  @ApiProperty({ example: 'تهران، خیابان ولیعصر، پلاک ۱۰' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  address: string;

  @ApiPropertyOptional({
    example: 35.6892,
    nullable: true,
    description: 'عرض جغرافیایی برای نقشه',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    example: 51.389,
    nullable: true,
    description: 'طول جغرافیایی برای نقشه',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiProperty({ example: '02112345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber: string;

  @ApiProperty({ example: 'شنبه تا پنجشنبه، ۹ تا ۱۸' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  workingHours: string;
}

export class UpdateContactSettingsDto extends PartialType(
  CreateContactSettingsDto,
  { skipNullProperties: false },
) {}

export class ContactSettingsResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional({ nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude: number | null;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  workingHours: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
