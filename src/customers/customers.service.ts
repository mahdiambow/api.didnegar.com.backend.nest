import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { canAccessSellerData } from '../common/tenant/tenant-access.js';
import { isSuperAdminRole } from '../roles/permissions.js';
import { OrdersService } from '../orders/orders.service.js';
import { OrderRepository } from '../orders/repositories/order.repository.js';
import { toOrderResponse } from '../orders/dto/order-response.dto.js';
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { Customer } from './entities/customer.entity.js';
import {
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
  customerExtrasFromOrder,
  toCustomerResponse,
} from './dto/customer.dto.js';
import { CustomerRepository } from './repositories/customer.repository.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customers: CustomerRepository,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly orderRepository: OrderRepository,
  ) {}

  async findAll(actor: AuthUser, query: ListCustomersQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const sellerId = this.resolveSellerScope(actor);
    const [items, total] = await this.customers.findPaginated(offset, limit, {
      sellerId,
      search: query.search,
      phone: query.phone,
    });
    const orderByCustomer = await this.orderRepository.findLatestByCustomerIds(
      items.map((c) => c.id),
    );
    return paginatedList(
      items.map((c) => {
        const order = orderByCustomer.get(c.id);
        return toCustomerResponse(c, customerExtrasFromOrder(order));
      }),
      page,
      limit,
      total,
    );
  }

  async findOne(actor: AuthUser, id: string) {
    const customer = await this.requireOwned(actor, id);
    const orderByCustomer = await this.orderRepository.findLatestByCustomerIds([
      customer.id,
    ]);
    const latest = orderByCustomer.get(customer.id);
    const order = latest
      ? await this.orderRepository.findById(latest.id)
      : null;
    return toCustomerResponse(customer, {
      ...customerExtrasFromOrder(order),
      order: order ? toOrderResponse(order) : undefined,
    });
  }

  async create(actor: AuthUser, dto: CreateCustomerDto) {
    if (!actor.sellerId && !isSuperAdminRole(actor.role)) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فقط سوپرسلر فروشگاه می‌تواند مشتری تلفنی ثبت کند',
        HttpStatus.FORBIDDEN,
      );
    }

    const { customer, orderId } = await this.dataSource.transaction(
      async (manager) => {
        const customerRepo = manager.getRepository(Customer);
        const saved = await customerRepo.save(
          customerRepo.create({
            phone: dto.phone.trim(),
            firstName: dto.firstName?.trim() || null,
            lastName: dto.lastName?.trim() || null,
            email: dto.email?.trim() || null,
            username: dto.username?.trim() || null,
            postalCode: dto.postalCode?.trim() || null,
            countryId: dto.countryId ?? null,
            stateId: dto.stateId ?? null,
            cityId: dto.cityId ?? null,
            sellerId: actor.sellerId,
            createdByUserId: actor.sub,
            userId: null,
            legacyId: null,
            legacyTable: null,
          }),
        );

        const orderId = await this.ordersService.createCustomerOrderInTransaction(
          manager,
          {
            customerId: saved.id,
            products: dto.products,
            shippingMethodId: dto.shippingMethodId,
            paymentMethod: dto.paymentMethod ?? null,
            price: dto.price,
            promotionCode: dto.promotionCode,
          },
        );

        return { customer: saved, orderId };
      },
    );

    const order = await this.orderRepository.findById(orderId);
    return toCustomerResponse(customer, {
      ...customerExtrasFromOrder(order),
      shippingMethodId:
        order?.shippingMethodId ?? dto.shippingMethodId ?? null,
      paymentMethod: order?.paymentMethod ?? dto.paymentMethod ?? null,
      order: order ? toOrderResponse(order) : undefined,
    });
  }

  async update(actor: AuthUser, id: string, dto: UpdateCustomerDto) {
    const customer = await this.requireOwned(actor, id);

    if (dto.phone !== undefined) customer.phone = dto.phone.trim();
    if (dto.firstName !== undefined) {
      customer.firstName = dto.firstName?.trim() || null;
    }
    if (dto.lastName !== undefined) {
      customer.lastName = dto.lastName?.trim() || null;
    }
    if (dto.email !== undefined) customer.email = dto.email?.trim() || null;
    if (dto.username !== undefined) {
      customer.username = dto.username?.trim() || null;
    }
    if (dto.postalCode !== undefined) {
      customer.postalCode = dto.postalCode?.trim() || null;
    }
    if (dto.countryId !== undefined) customer.countryId = dto.countryId ?? null;
    if (dto.stateId !== undefined) customer.stateId = dto.stateId ?? null;
    if (dto.cityId !== undefined) customer.cityId = dto.cityId ?? null;

    const saved = await this.customers.save(customer);
    const orderByCustomer = await this.orderRepository.findLatestByCustomerIds([
      saved.id,
    ]);
    const order = orderByCustomer.get(saved.id);
    return toCustomerResponse(saved, customerExtrasFromOrder(order));
  }

  async remove(actor: AuthUser, id: string) {
    const customer = await this.requireOwned(actor, id);
    await this.customers.remove(customer);
    return { id };
  }

  async resolveForSeller(actor: AuthUser, customerId: string) {
    return this.requireOwned(actor, customerId);
  }

  private async requireOwned(actor: AuthUser, id: string) {
    const customer = await this.customers.findById(id);
    if (!customer) {
      throw new ApiException(
        'CUSTOMER_NOT_FOUND',
        'مشتری یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!canAccessSellerData(actor, customer.sellerId)) {
      throw new ApiException(
        'CUSTOMER_FORBIDDEN',
        'دسترسی به این مشتری مجاز نیست',
        HttpStatus.FORBIDDEN,
      );
    }
    return customer;
  }

  private resolveSellerScope(actor: AuthUser): string | null {
    if (isSuperAdminRole(actor.role)) return null;
    if (!actor.sellerId) {
      throw new ApiException(
        'SELLER_REQUIRED',
        'فقط سوپرسلر فروشگاه می‌تواند لیست مشتریان را ببیند',
        HttpStatus.FORBIDDEN,
      );
    }
    return actor.sellerId;
  }
}
