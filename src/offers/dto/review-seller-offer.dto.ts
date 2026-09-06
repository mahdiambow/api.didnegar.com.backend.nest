import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

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
  })
  @IsIn(OFFER_APPROVAL_STATUSES)
  approvalStatus: OfferApprovalStatus;

  @ApiPropertyOptional({
    example: 'SKU با مشخصات محصول هم‌خوان نیست',
    nullable: true,
  })
  @ValidateIf((dto: ReviewSellerOfferDto) => dto.approvalStatus === 'rejected')
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}

/** فیلدهایی که تغییرشان فوری و بدون تأیید ادمین اعمال می‌شود */
export const OFFER_IMMEDIATE_FIELDS = new Set([
  'price',
  'stockQuantity',
  'stockStatus',
  'isOnSale',
  'isActive',
]);
