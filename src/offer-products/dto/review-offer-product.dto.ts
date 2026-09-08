import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

export const OFFER_PRODUCT_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type OfferProductApprovalStatus =
  (typeof OFFER_PRODUCT_APPROVAL_STATUSES)[number];

export class ReviewOfferProductDto {
  @ApiProperty({
    enum: OFFER_PRODUCT_APPROVAL_STATUSES,
    example: 'approved',
  })
  @IsIn(OFFER_PRODUCT_APPROVAL_STATUSES)
  approvalStatus: OfferProductApprovalStatus;

  @ApiPropertyOptional({
    example: 'اطلاعات محصول ناقص است',
    nullable: true,
  })
  @ValidateIf(
    (dto: ReviewOfferProductDto) => dto.approvalStatus === 'rejected',
  )
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}
