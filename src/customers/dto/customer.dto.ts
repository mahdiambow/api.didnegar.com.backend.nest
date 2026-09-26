import { IsULID } from '../../common/id/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
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
import {
  ORDER_PAYMENT_METHODS,
  OrderPriceDto,
  type OrderPaymentMethod,
} from '../../orders/dto/create-order.dto.js';
import {
  OrderPriceResponseDto,
  OrderResponseDto,
  toOrderPrice,
} from '../../orders/dto/order-response.dto.js';
import type { Order } from '../../orders/entities/order.entity.js';

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
    description:
      'محصولات سفارش تلفنی — همزمان با ثبت مشتری یک Order با type=customer ساخته می‌شود',
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
    enum: ORDER_PAYMENT_METHODS,
    description: 'روش پرداخت — مثل سفارش: credit | iBank | loan | partial-bank',
  })
  @IsOptional()
  @IsIn([...ORDER_PAYMENT_METHODS])
  paymentMethod?: OrderPaymentMethod;

  @ApiPropertyOptional({
    type: OrderPriceDto,
    description: 'قیمت سفارش تلفنی: price / discountAmount / totalPrice',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderPriceDto)
  price?: OrderPriceDto;
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
  orderId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'روش ارسال سفارش تلفنی مرتبط',
  })
  shippingMethodId?: string | null;

  @ApiPropertyOptional({
    enum: ORDER_PAYMENT_METHODS,
    nullable: true,
    description: 'روش پرداخت سفارش تلفنی',
  })
  paymentMethod?: string | null;

  @ApiPropertyOptional({
    type: OrderPriceResponseDto,
    nullable: true,
    description: 'قیمت سفارش: price / discountAmount / totalPrice',
  })
  price?: OrderPriceResponseDto | null;

  @ApiPropertyOptional({ description: 'جزئیات سفارش تلفنی (type=customer)' })
  order?: OrderResponseDto;

  @ApiPropertyOptional({ nullable: true })
  createdAt: Date | null;

  @ApiProperty()
  updatedAt: Date;
}

export function toCustomerResponse(
  customer: Customer,
  extra?: {
    orderId?: string | null;
    shippingMethodId?: string | null;
    paymentMethod?: string | null;
    price?: OrderPriceResponseDto | null;
    order?: OrderResponseDto;
  },
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
    orderId: extra?.orderId ?? null,
    shippingMethodId: extra?.shippingMethodId ?? null,
    paymentMethod: extra?.paymentMethod ?? null,
    price: extra?.price ?? null,
    order: extra?.order,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export function customerExtrasFromOrder(order?: Order | null) {
  if (!order) {
    return {
      orderId: null as string | null,
      shippingMethodId: null as string | null,
      paymentMethod: null as string | null,
      price: null as OrderPriceResponseDto | null,
    };
  }
  return {
    orderId: order.id,
    shippingMethodId: order.shippingMethodId ?? null,
    paymentMethod: order.paymentMethod ?? null,
    price: toOrderPrice(order),
  };
}
