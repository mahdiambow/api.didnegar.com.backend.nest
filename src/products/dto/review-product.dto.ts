import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

export const PRODUCT_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type ProductApprovalStatus =
  (typeof PRODUCT_APPROVAL_STATUSES)[number];

export class ReviewProductDto {
  @ApiProperty({
    enum: PRODUCT_APPROVAL_STATUSES,
    example: 'approved',
    description: 'وضعیت تأیید محصول: pending | approved | rejected',
  })
  @IsIn(PRODUCT_APPROVAL_STATUSES)
  approvalStatus: ProductApprovalStatus;

  @ApiPropertyOptional({
    example: 'تصاویر محصول ناقص است',
    description: 'دلیل رد — برای rejected الزامی است',
    nullable: true,
  })
  @ValidateIf((dto: ReviewProductDto) => dto.approvalStatus === 'rejected')
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string | null;
}
