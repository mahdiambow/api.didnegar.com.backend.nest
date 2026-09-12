import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateProductDto } from '../../products/dto/create-product.dto.js';

/** آپدیت فیلدهای کاتالوگ محصول هنگام ثبت/ویرایش آفر (بدون approval) */
export class SellerOfferProductPatchDto extends PartialType(
  OmitType(CreateProductDto, ['approvalStatus', 'rejectionReason'] as const),
) {}

/** یک آیتم پیشنهاد برای یک محصول */
export class SellerOfferItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'SAM-S24U-256-BLU', description: 'باید یکتا باشد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ example: 68000000 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999999999999)
  price: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock: number;

  @ApiProperty({ enum: ['instock', 'outofstock', 'onbackorder'] })
  @IsIn(['instock', 'outofstock', 'onbackorder'])
  stockStatus: string;

  @ApiPropertyOptional({ default: false })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isOnSale?: boolean;

  @ApiPropertyOptional({ nullable: true, example: 'taxable' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxStatus?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'standard' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxClass?: string | null;

  @ApiPropertyOptional({ default: true })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: SellerOfferProductPatchDto,
    description:
      'در صورت ارسال، فیلدهای کاتالوگ همان productId آپدیت می‌شوند (محصول → pending)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SellerOfferProductPatchDto)
  product?: SellerOfferProductPatchDto;
}

/** ثبت یک یا چند پیشنهاد فروش برای فروشنده لاگین‌شده */
export class CreateSellerOffersDto {
  @ApiProperty({
    type: [SellerOfferItemDto],
    description: 'آرایه پیشنهادها برای محصولات مختلف — sellerId از JWT خوانده می‌شود',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SellerOfferItemDto)
  items: SellerOfferItemDto[];
}

export class UpdateSellerOfferDto extends PartialType(
  OmitType(SellerOfferItemDto, ['productId'] as const),
  { skipNullProperties: false },
) {}

export class ListSellerOffersDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() sellerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SellerOfferResponseDto extends SellerOfferItemDto {
  @ApiProperty({ format: 'uuid' })
  offerId: string;
  @ApiProperty()
  sellerId: string;
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  approvalStatus: 'pending' | 'approved' | 'rejected';
  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

/** فیلدهایی که تغییرشان فوری اعمال می‌شود */
export const OFFER_IMMEDIATE_FIELDS = new Set([
  'price',
  'stock',
  'stockStatus',
  'isOnSale',
  'isActive',
]);

export const OFFER_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type OfferApprovalStatus = (typeof OFFER_APPROVAL_STATUSES)[number];

export class ReviewSellerOfferDto {
  @ApiProperty({
    enum: OFFER_APPROVAL_STATUSES,
    example: 'approved',
    description: 'وضعیت تأیید پیشنهاد: pending | approved | rejected',
  })
  @IsIn(OFFER_APPROVAL_STATUSES)
  approvalStatus: OfferApprovalStatus;

  @ApiPropertyOptional({
    example: 'قیمت نامعتبر است',
    description: 'دلیل رد — برای rejected الزامی است',
    nullable: true,
  })
  @ValidateIf((dto: ReviewSellerOfferDto) => dto.approvalStatus === 'rejected')
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}
