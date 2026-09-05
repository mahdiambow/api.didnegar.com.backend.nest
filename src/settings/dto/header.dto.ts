import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateHeaderDto {
  @ApiProperty({
    example: 'ارسال رایگان برای خریدهای بالای یک میلیون تومان',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

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

export class UpdateHeaderDto extends PartialType(CreateHeaderDto, {
  skipNullProperties: false,
}) {}

export class HeaderResponseDto extends CreateHeaderDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
