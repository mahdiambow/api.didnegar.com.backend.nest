import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AboutUsFaqItemDto {
  @ApiProperty({ example: 'دیدنگار چیست؟' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @ApiProperty({ example: 'پلتفرم فروش آنلاین محصولات دیجیتال است.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  answer: string;
}

export class CreateAboutUsDto {
  @ApiProperty({ example: 'درباره ما' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'دیدنگار یک پلتفرم فروش آنلاین برای محصولات دیجیتال است.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;

  @ApiProperty({
    type: [AboutUsFaqItemDto],
    example: [
      {
        question: 'چطور سفارش ثبت کنم؟',
        answer: 'از طریق فروشگاه محصول را انتخاب و پرداخت کنید.',
      },
    ],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AboutUsFaqItemDto)
  faqs: AboutUsFaqItemDto[];
}

export class UpdateAboutUsDto extends PartialType(CreateAboutUsDto, {
  skipNullProperties: false,
}) {}

export class AboutUsResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'درباره ما' })
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [AboutUsFaqItemDto] })
  faqs: AboutUsFaqItemDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
