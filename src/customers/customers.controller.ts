import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParseULIDPipe } from '../common/id/index.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { RequirePermissions } from '../utils/auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../utils/auth/guards/permissions.guard.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { CustomersService } from './customers.service.js';
import {
  CreateCustomerDto,
  CustomerResponseDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from './dto/customer.dto.js';

const CustomerApiDto = createSuccessResponseDto(CustomerResponseDto, {
  code: 'CUSTOMER_FOUND',
  message: 'Customer retrieved successfully',
  name: 'Customer',
});

const CustomersPaginatedApiDto = createPaginatedResponseDto(
  CustomerResponseDto,
  {
    code: 'CUSTOMERS_FOUND',
    message: 'Customers retrieved successfully',
    name: 'Customers',
  },
);

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.customers.read)
  @ApiResponseMeta({
    code: 'CUSTOMERS_FOUND',
    message: 'Customers retrieved successfully',
  })
  @ApiOperation({
    summary: 'List phone-order customers',
    description:
      'لیست مشتریان تلفنی فروشگاه — جدا از User؛ برای سفارش تلفنی سوپرسلر',
  })
  @ApiOkResponse({ type: CustomersPaginatedApiDto })
  findAll(
    @Req() req: { user: AuthUser },
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.customers.read)
  @ApiResponseMeta({
    code: 'CUSTOMER_FOUND',
    message: 'Customer retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get customer by id',
    description: 'دریافت یک مشتری تلفنی',
  })
  @ApiOkResponse({ type: CustomerApiDto })
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.customersService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.customers.create)
  @ApiResponseMeta({
    code: 'CUSTOMER_CREATED',
    message: 'Customer created successfully',
  })
  @ApiOperation({
    summary: 'Create phone-order customer',
    description:
      'ثبت مشتری تلفنی + سفارش (type=customer). با promotionCode تخفیف پروموشن روی مبلغ سفارش اعمال می‌شود (نه تخفیف price محصول).',
  })
  @ApiOkResponse({ type: CustomerApiDto })
  create(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.customers.update)
  @ApiResponseMeta({
    code: 'CUSTOMER_UPDATED',
    message: 'Customer updated successfully',
  })
  @ApiOperation({
    summary: 'Update customer',
    description: 'ویرایش مشتری تلفنی',
  })
  @ApiOkResponse({ type: CustomerApiDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.customers.delete)
  @ApiResponseMeta({
    code: 'CUSTOMER_DELETED',
    message: 'Customer deleted successfully',
  })
  @ApiOperation({
    summary: 'Delete customer',
    description: 'حذف مشتری تلفنی',
  })
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseULIDPipe) id: string,
  ) {
    return this.customersService.remove(req.user, id);
  }
}
