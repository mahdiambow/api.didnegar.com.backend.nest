import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateParentCategoryDto {
  @ApiProperty({ example: 'کالای دیجیتال', description: 'نام فارسی دسته والد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Digital', description: 'عنوان انگلیسی' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @ApiProperty({
    example: 'digital',
    description: 'شناسه یکتا — حروف کوچک، عدد و -',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/digital-icon.svg',
    description: 'URL آیکون',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/digital.jpg',
    description: 'URL تصویر',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string | null;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sort?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'دسته ویژه — اگر true باشد specialImage برمی‌گردد',
  })
  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/digital-special.jpg',
    description: 'URL تصویر ویژه (وقتی isSpecial=true)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  specialImage?: string | null;
}

export class UpdateParentCategoryDto {
  @ApiPropertyOptional({ example: 'کالای دیجیتال و الکترونیک' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Digital & Electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string | null;

  @ApiPropertyOptional({ example: 'digital-electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/digital-icon.svg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/digital.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sort?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'دسته ویژه — اگر true باشد specialImage برمی‌گردد',
  })
  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/digital-special.jpg',
    description: 'URL تصویر ویژه',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  specialImage?: string | null;
}
