import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto.js';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto.js';
import {
  calculateOrderAmounts,
  toShippingMethodResponse,
  ShippingQuoteResponseDto,
} from './dto/shipping.dto.js';

@Injectable()
export class ShippingService {
  constructor(
    private readonly shippingMethodRepository: ShippingMethodRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    isActive?: boolean;
  }) {
    const { page, limit, offset } = getPaginationParams(query);

    const [items, total] = await this.shippingMethodRepository.findPaginated(
      offset,
      limit,
      query.isActive,
    );

    return paginatedList(
      items.map(toShippingMethodResponse),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    const method = await this.shippingMethodRepository.findByIdAny(id);
    if (!method) {
      throw new ApiException(
        'SHIPPING_METHOD_NOT_FOUND',
        'روش ارسال یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toShippingMethodResponse(method);
  }

  async create(dto: CreateShippingMethodDto) {
    const existing = await this.shippingMethodRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ApiException(
        'SHIPPING_METHOD_SLUG_EXISTS',
        'روش ارسال با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const method = await this.shippingMethodRepository.save(
      this.shippingMethodRepository.create({
        slug: dto.slug,
        name: dto.name,
        price: dto.price,
        isCod: dto.isCod ?? true,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );

    return toShippingMethodResponse(method);
  }

  async update(id: string, dto: UpdateShippingMethodDto) {
    const method = await this.shippingMethodRepository.findByIdAny(id);
    if (!method) {
      throw new ApiException(
        'SHIPPING_METHOD_NOT_FOUND',
        'روش ارسال یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.slug && dto.slug !== method.slug) {
      const slugTaken = await this.shippingMethodRepository.findBySlug(dto.slug);
      if (slugTaken) {
        throw new ApiException(
          'SHIPPING_METHOD_SLUG_EXISTS',
          'روش ارسال با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(method, dto);
    const updated = await this.shippingMethodRepository.save(method);
    return toShippingMethodResponse(updated);
  }

  async remove(id: string) {
    const method = await this.shippingMethodRepository.findByIdAny(id);
    if (!method) {
      throw new ApiException(
        'SHIPPING_METHOD_NOT_FOUND',
        'روش ارسال یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const ordersCount =
      await this.shippingMethodRepository.countOrdersByShippingMethodId(id);

    if (ordersCount > 0) {
      throw new ApiException(
        'SHIPPING_METHOD_IN_USE',
        'این روش ارسال در سفارش‌ها استفاده شده و قابل حذف نیست',
        HttpStatus.CONFLICT,
      );
    }

    await this.shippingMethodRepository.remove(method);
    return {};
  }

  async getQuote(input: {
    productId: string;
    quantity?: number;
    shippingMethodId: string;
  }): Promise<ShippingQuoteResponseDto> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const shippingMethod = await this.shippingMethodRepository.findById(
      input.shippingMethodId,
    );
    if (!shippingMethod) {
      throw new ApiException(
        'SHIPPING_METHOD_NOT_FOUND',
        'روش ارسال یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const quantity = input.quantity ?? 1;
    const unitPrice = Number(product.minPrice ?? product.maxPrice ?? 0);

    if (unitPrice <= 0) {
      throw new ApiException(
        'PRODUCT_PRICE_INVALID',
        'قیمت محصول تعریف نشده است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amounts = calculateOrderAmounts(
      unitPrice,
      quantity,
      Number(shippingMethod.price),
      shippingMethod.isCod,
    );

    return {
      productId: product.id,
      quantity,
      shippingMethod: toShippingMethodResponse(shippingMethod),
      ...amounts,
    };
  }

  async resolveShippingMethod(shippingMethodId: string) {
    const shippingMethod =
      await this.shippingMethodRepository.findById(shippingMethodId);
    if (!shippingMethod) {
      throw new ApiException(
        'SHIPPING_METHOD_NOT_FOUND',
        'روش ارسال یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return shippingMethod;
  }
}
