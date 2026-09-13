import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  FOOTER_ABOUT_US_EXAMPLE,
  FOOTER_EXAMPLE,
  FOOTER_ENAMAD_URLS_EXAMPLE,
  FOOTER_MENU_LINKS_EXAMPLE,
  FOOTER_RESPONSE_EXAMPLE,
} from './footer.examples.js';

export class FooterMenuSubLinkDto {
  @ApiProperty({ example: 'گارانتی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: '/services/warranty',
    description: 'لینک زیرمنو — می‌تواند خالی، مسیر نسبی یا URL کامل باشد',
  })
  @IsString()
  @MaxLength(2048)
  url: string;
}

export class FooterMenuLinkDto {
  @ApiProperty({ example: 'خدمات' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: '/services',
    description: 'لینک منو — می‌تواند خالی، مسیر نسبی یا URL کامل باشد',
  })
  @IsString()
  @MaxLength(2048)
  url: string;

  @ApiPropertyOptional({
    type: [FooterMenuSubLinkDto],
    example: FOOTER_MENU_LINKS_EXAMPLE[0].subMenu,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FooterMenuSubLinkDto)
  subMenu?: FooterMenuSubLinkDto[];
}

export class FooterAboutUsDto {
  @ApiProperty({
    example: FOOTER_ABOUT_US_EXAMPLE.title,
    description: 'عنوان بخش درباره ما در فوتر',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: FOOTER_ABOUT_US_EXAMPLE.text,
    description: 'متن درباره ما در فوتر',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}

export class CreateFooterDto {
  @ApiPropertyOptional({
    example: FOOTER_EXAMPLE.logoUrl,
    description: 'URL لوگو',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @ApiPropertyOptional({
    example: FOOTER_EXAMPLE.logoText,
    description: 'متن کنار لوگو',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  logoText?: string | null;

  @ApiPropertyOptional({
    type: [FooterMenuLinkDto],
    description: 'لینک‌های منوی فوتر (با زیرمنوی اختیاری)',
    example: FOOTER_MENU_LINKS_EXAMPLE,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FooterMenuLinkDto)
  menuLinks?: FooterMenuLinkDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'حداکثر ۴ URL اینماد / نشان اعتماد',
    example: FOOTER_ENAMAD_URLS_EXAMPLE,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true },
  )
  @MaxLength(2048, { each: true })
  enamadUrls?: string[];

  @ApiPropertyOptional({
    type: FooterAboutUsDto,
    nullable: true,
    description: 'بلاک درباره ما در فوتر (عنوان + متن)',
    example: FOOTER_ABOUT_US_EXAMPLE,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FooterAboutUsDto)
  aboutUs?: FooterAboutUsDto | null;

  @ApiProperty({ example: FOOTER_EXAMPLE.address })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  address: string;

  @ApiProperty({ example: FOOTER_EXAMPLE.phoneNumber })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber: string;

  @ApiProperty({ example: FOOTER_EXAMPLE.email })
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  @IsEmail()
  email: string;

  @ApiProperty({ example: FOOTER_EXAMPLE.workingHours })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  workingHours: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: FOOTER_EXAMPLE.instagram,
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  instagram?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: FOOTER_EXAMPLE.whatsapp,
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  whatsapp?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: FOOTER_EXAMPLE.telegram,
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  telegram?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: FOOTER_EXAMPLE.bale,
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  bale?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: FOOTER_EXAMPLE.rubika,
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
  @ApiProperty({ example: FOOTER_RESPONSE_EXAMPLE.id })
  id: number;

  @ApiProperty({
    example: FOOTER_RESPONSE_EXAMPLE.logoUrl,
    nullable: true,
  })
  declare logoUrl: string | null;

  @ApiProperty({
    example: FOOTER_RESPONSE_EXAMPLE.logoText,
    nullable: true,
  })
  declare logoText: string | null;

  @ApiProperty({
    type: [FooterMenuLinkDto],
    example: FOOTER_RESPONSE_EXAMPLE.menuLinks,
  })
  declare menuLinks: FooterMenuLinkDto[];

  @ApiProperty({
    type: [String],
    example: FOOTER_RESPONSE_EXAMPLE.enamadUrls,
    description: 'حداکثر ۴ URL اینماد / نشان اعتماد',
  })
  declare enamadUrls: string[];

  @ApiProperty({
    type: FooterAboutUsDto,
    nullable: true,
    example: FOOTER_RESPONSE_EXAMPLE.aboutUs,
    description: 'بلاک درباره ما در فوتر (عنوان + متن)',
  })
  declare aboutUs: FooterAboutUsDto | null;

  @ApiProperty({ example: FOOTER_RESPONSE_EXAMPLE.createdAt })
  createdAt: Date;

  @ApiProperty({ example: FOOTER_RESPONSE_EXAMPLE.updatedAt })
  updatedAt: Date;
}
