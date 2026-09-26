import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import type { Customer } from '../entities/customer.entity.js';
import type { OrderResponseDto } from '../../orders/dto/order-response.dto.js';

export class CustomerOrderProductDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  @IsULID()
  offerId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateCustomerDto {
  @ApiProperty({ example: '09333333333', description: 'شماره تماس خریدار تلفنی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'علی' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({ example: 'محمدی' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({ example: 'ali-m' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  username?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: '01JEX000000000000000000010' })
  @IsOptional()
  @IsULID()
  countryId?: string;

  @ApiPropertyOptional({ example: '01JEX000000000000000000020' })
  @IsOptional()
  @IsULID()
  stateId?: string;

  @ApiPropertyOptional({ example: '01JEX000000000000000000030' })
  @IsOptional()
  @IsULID()
  cityId?: string;

  @ApiProperty({
    type: [CustomerOrderProductDto],
    minItems: 1,
    description: 'محصولات سفارش تلفنی — همزمان با ثبت مشتری یک Order با type=customer ساخته می‌شود',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: CustomerOrderProductDto) => item?.offerId)
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderProductDto)
  products: CustomerOrderProductDto[];

  @ApiProperty({ example: '01JEX000000000000000000030' })
  @IsULID()
  shippingMethodId: string;

  @ApiPropertyOptional({
    example: 'NOWROOZ20',
    description:
      'کد پروموشن — روی مبلغ سفارش تلفنی اعمال می‌شود (با تخفیف price محصول فرق دارد)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  promotionCode?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: '09333333333' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'علی' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({ example: 'محمدی' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({ example: 'ali-m' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  username?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  stateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsULID()
  cityId?: string;
}

export class ListCustomersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '0933',
    description: 'جستجو در تلفن، نام، نام‌خانوادگی، ایمیل',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: '09333333333' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

export class CustomerResponseDto {
  @ApiProperty({ example: '01JEX000000000000000000010' })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  sellerId: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdByUserId: string | null;

  @ApiPropertyOptional({ nullable: true })
  username: string | null;

  @ApiPropertyOptional({ nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiProperty({ example: '09333333333' })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  countryId: string | null;

  @ApiPropertyOptional({ nullable: true })
  stateId: string | null;

  @ApiPropertyOptional({ nullable: true })
  cityId: string | null;

  @ApiPropertyOptional({ nullable: true })
  postalCode: string | null;

  @ApiPropertyOptional({
    description: 'شناسه سفارش تلفنی ساخته‌شده همراه ثبت مشتری',
  })
  orderId?: string;

  @ApiPropertyOptional({ description: 'جزئیات سفارش تلفنی (type=customer)' })
  order?: OrderResponseDto;

  @ApiPropertyOptional({ nullable: true })
  createdAt: Date | null;

  @ApiProperty()
  updatedAt: Date;
}

export function toCustomerResponse(
  customer: Customer,
  extra?: { orderId?: string; order?: OrderResponseDto },
): CustomerResponseDto {
  return {
    id: customer.id,
    sellerId: customer.sellerId,
    createdByUserId: customer.createdByUserId,
    username: customer.username,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    countryId: customer.countryId,
    stateId: customer.stateId,
    cityId: customer.cityId,
    postalCode: customer.postalCode,
    orderId: extra?.orderId,
    order: extra?.order,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
