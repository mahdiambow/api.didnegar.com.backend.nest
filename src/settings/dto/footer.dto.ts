import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateFooterDto {
  @ApiProperty({ example: 'تهران، خیابان جمهوری' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  address: string;

  @ApiProperty({ example: '02112345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber: string;

  @ApiProperty({ example: 'info@example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'شنبه تا پنجشنبه، ۹ تا ۱۸' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  workingHours: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/instagram',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  instagram?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/whatsapp',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  whatsapp?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/telegram',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  telegram?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/bale',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  bale?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/rubika',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  rubika?: string | null;
}

export class UpdateFooterDto extends PartialType(CreateFooterDto, {
  skipNullProperties: false,
}) {}

export class FooterResponseDto extends CreateFooterDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
