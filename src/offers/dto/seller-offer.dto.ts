import { IsULID } from '../../common/id/index.js';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateProductDto } from '../../products/dto/create-product.dto.js';
import {
  ProductListItemDto,
  ProductResponseDto,
} from '../../products/dto/product-response.dto.js';
import { CATEGORY_EXAMPLES } from '../../categories/dto/category.examples.js';

export const OFFER_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type OfferApprovalStatus = (typeof OFFER_APPROVAL_STATUSES)[number];

/** آپدیت فیلدهای کاتالوگ محصول هنگام ثبت/ویرایش آفر (بدون approval) */
export class SellerOfferProductPatchDto extends PartialType(
  OmitType(CreateProductDto, ['approvalStatus', 'rejectionReason'] as const),
) {}

/** یک آیتم پیشنهاد برای یک محصول */
export class SellerOfferItemDto {
  @ApiPropertyOptional({
    description:
      'شناسه محصول موجود. اگر نباشد یا در کاتالوگ پیدا نشود، از روی فیلد product (و sku/price/stock آفر) محصول جدید ساخته می‌شود.',
  })
  @IsOptional()
  @IsULID()
  productId?: string;

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
      'فیلدهای کاتالوگ: اگر محصول موجود باشد آپدیت می‌شود؛ اگر نباشد برای ساخت محصول جدید به‌کار می‌رود (حداقل name/slug توصیه می‌شود)',
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
) {
  @ApiPropertyOptional({
    enum: OFFER_APPROVAL_STATUSES,
    example: 'approved',
    description: 'اختیاری — تأیید/رد/pending همین‌جا؛ در غیر این صورت از PATCH .../approval استفاده کنید',
  })
  @IsOptional()
  @IsIn(OFFER_APPROVAL_STATUSES)
  approvalStatus?: OfferApprovalStatus;

  @ApiPropertyOptional({
    example: 'قیمت نامعتبر است',
    description: 'دلیل رد — وقتی approvalStatus=rejected الزامی است',
    nullable: true,
  })
  @ValidateIf(
    (dto: UpdateSellerOfferDto) => dto.approvalStatus === 'rejected',
  )
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}

export class ListSellerOffersDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsULID() sellerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsULID() productId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر بر اساس دسته اصلی محصول لینک‌شده',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'فیلتر بر اساس زیردسته محصول لینک‌شده',
  })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected'],
    description:
      'فقط وقتی لاگین فروشنده باشید برای آفرهای خودتان اعمال می‌شود؛ بدون توکن همیشه فقط approved',
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  approvalStatus?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({
    default: true,
    description:
      'اگر false باشد COUNT سنگین اجرا نمی‌شود؛ hasNext از روی تعداد آیتم‌ها تخمین زده می‌شود',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'false' || value === false
      ? false
      : value === 'true' || value === true
        ? true
        : value,
  )
  @IsBoolean()
  includeTotal?: boolean = true;
}

/** لیست آفرهای خود فروشنده — sellerId از JWT؛ پیش‌فرض همه وضعیت‌ها */
export class ListMySellerOffersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '01JEX000000000000000000010',
    description: 'فیلتر یک محصول',
  })
  @IsOptional()
  @IsULID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected'],
    description:
      'فیلتر وضعیت تأیید — اگر نفرستید همه pending/approved/rejected خودتان می‌آید',
    example: 'pending',
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  approvalStatus?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.categoryId,
    description: 'فیلتر دسته اصلی محصول',
  })
  @IsOptional()
  @IsULID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: CATEGORY_EXAMPLES.subCategoryId,
    description: 'فیلتر زیردسته محصول',
  })
  @IsOptional()
  @IsULID()
  subCategoryId?: string;

  @ApiPropertyOptional({
    default: true,
    description:
      'اگر false باشد COUNT سنگین اجرا نمی‌شود؛ hasNext از روی تعداد آیتم‌ها تخمین زده می‌شود',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'false' || value === false
      ? false
      : value === 'true' || value === true
        ? true
        : value,
  )
  @IsBoolean()
  includeTotal?: boolean = true;
}

export class SellerOfferResponseDto extends OmitType(SellerOfferItemDto, [
  'product',
] as const) {
  @ApiProperty({ format: 'ulid' })
  offerId: string;
  @ApiProperty({ format: 'ulid' })
  productId: string;
  @ApiProperty()
  sellerId: string;
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  approvalStatus: 'pending' | 'approved' | 'rejected';
  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;
  @ApiPropertyOptional({
    type: ProductListItemDto,
    description:
      'خلاصه محصول در لیست (نام/دسته/قیمت/برند/عکس) — جزئیات کامل در GET تکی',
  })
  product?: ProductListItemDto | ProductResponseDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

/** پاسخ لیست آفر — فقط فیلدهای کارت/جدول */
export class SellerOfferListItemDto {
  @ApiProperty({ format: 'ulid' })
  offerId: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty({ format: 'ulid' })
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiProperty({ example: 68000000 })
  price: number;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty({ enum: ['instock', 'outofstock', 'onbackorder'] })
  stockStatus: string;

  @ApiProperty()
  isOnSale: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ type: ProductListItemDto })
  product?: ProductListItemDto;

  @ApiProperty()
  createdAt: Date;
}

/** فیلدهایی که تغییرشان فوری اعمال می‌شود */
export const OFFER_IMMEDIATE_FIELDS = new Set([
  'price',
  'stock',
  'stockStatus',
  'isOnSale',
  'isActive',
]);

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
