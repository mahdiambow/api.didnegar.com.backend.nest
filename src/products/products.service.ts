import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CategoriesService } from '../categories/categories.service.js';
import { AttributeRepository } from '../attributes/repositories/attribute.repository.js';
import { AttributeValueRepository } from '../attributes/repositories/attribute-value.repository.js';
import { SellerRepository } from '../sellers/repositories/seller.repository.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import {
  resolveProductStock,
  toProductEntityData,
} from './dto/product-fields.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';
import {
  toAttributeResponse,
  toAttributeValueResponse,
  toBrandResponse,
  toProductResponse,
  toSellerResponse,
  type ProductResponseDto,
} from './dto/product-response.dto.js';
import { BrandRepository } from '../brands/repositories/brand.repository.js';
import { ShippingMethodRepository } from '../shipping/repositories/shipping-method.repository.js';
import { toShippingMethodResponse } from '../shipping/dto/shipping.dto.js';
import { Product } from './entities/product.entity.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductStockRepository } from './repositories/product-stock.repository.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productStockRepository: ProductStockRepository,
    private readonly brandRepository: BrandRepository,
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
    private readonly sellerRepository: SellerRepository,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
    private readonly shippingMethodRepository: ShippingMethodRepository,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    approvalStatus?: string;
    isActive?: boolean;
    brandId?: string;
    search?: string;
    name?: string;
    categoryId?: string;
    subCategoryId?: string;
  }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.productRepository.findPaginated(
      offset,
      limit,
      {
        status: query.status,
        approvalStatus: query.approvalStatus,
        isActive: query.isActive,
        brandId: query.brandId,
        search: query.search,
        name: query.name,
        categoryId: query.categoryId,
        subCategoryId: query.subCategoryId,
      },
      true,
    );

    return paginatedList(
      await this.toEnrichedProductResponses(items),
      page,
      limit,
      total,
    );
  }

  /** کاتالوگ پابلیک — pagination + search/category؛ فقط publish + approved + active */
  async findAllPublic(query: {
    page?: string | number;
    limit?: string | number;
    brandId?: string;
    search?: string;
    name?: string;
    categoryId?: string;
    subCategoryId?: string;
  } = {}) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.productRepository.findPaginated(
      offset,
      limit,
      {
        status: 'publish',
        approvalStatus: 'approved',
        isActive: true,
        brandId: query.brandId,
        search: query.search,
        name: query.name,
        categoryId: query.categoryId,
        subCategoryId: query.subCategoryId,
      },
      true,
    );

    return paginatedList(
      await this.toEnrichedProductResponses(items),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string) {
    const product = await this.productRepository.findById(id, true);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    const [response] = await this.toEnrichedProductResponses([product]);
    return response;
  }

  /** یک محصول پابلیک — فقط اگر publish + approved + active باشد */
  async findOnePublic(id: string) {
    const product = await this.productRepository.findById(id, true);
    if (
      !product ||
      product.status !== 'publish' ||
      product.approvalStatus !== 'approved' ||
      product.isActive === false
    ) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    const [response] = await this.toEnrichedProductResponses([product]);
    return response;
  }

  async findByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return [] as ProductResponseDto[];
    const products = await this.productRepository.findByIds(uniqueIds, true);
    return this.toEnrichedProductResponses(products);
  }

  async create(dto: CreateProductDto) {
    const { categoryIds, sellerIds, ...productData } = dto;

    await this.assertSlugAvailable(productData.slug);
    await this.assertSkuAvailable(productData.sku);
    if (productData.brandId) {
      await this.assertBrandExists(productData.brandId);
    }
    if (productData.shippingMethodId) {
      await this.assertShippingMethodExists(productData.shippingMethodId);
    }
    await this.assertSellersExist(sellerIds);

    if (
      productData.approvalStatus === 'rejected' &&
      !productData.rejectionReason?.trim()
    ) {
      throw new ApiException(
        'REJECTION_REASON_REQUIRED',
        'برای رد محصول باید دلیل وارد شود',
        HttpStatus.BAD_REQUEST,
      );
    }

    const legacyId = await this.productRepository.getNextLegacyId();
    let product;
    try {
      product = await this.productRepository.save(
        this.productRepository.create(
          toProductEntityData({ ...productData, sellerIds }, legacyId),
        ),
      );
    } catch (error) {
      this.throwIfDuplicateKey(error);
      throw error;
    }

    await this.productStockRepository.upsertForProduct(
      product.id,
      resolveProductStock(productData),
    );

    await this.categoriesService.assignCategoryIdsToProduct(
      product.id,
      categoryIds ?? [],
    );

    const loaded = await this.productRepository.findById(product.id, true);
    const [response] = await this.toEnrichedProductResponses([loaded!]);
    return response;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const { categoryIds, sellerIds, stock, ...productData } = dto;

    if (productData.price !== undefined) {
      productData.price =
        productData.price === null
          ? []
          : productData.price.map((item) => ({
              attributeIds: [
                ...new Set(item.valueAttributeIds ?? item.attributeIds ?? []),
              ],
              price: item.price ?? null,
              discountPercentage: item.discountPercentage ?? null,
              discountAmount: item.discountAmount ?? null,
              expireDate: item.expireDate ?? null,
              maxQuantity: item.maxQuantity ?? null,
              minQuantity: item.minQuantity ?? null,
              finalPrice: item.finalPrice ?? null,
            }));
    }

    if (productData.slug !== undefined && productData.slug !== product.slug) {
      await this.assertSlugAvailable(productData.slug, product.id);
    }
    if (productData.sku !== undefined && productData.sku !== product.sku) {
      await this.assertSkuAvailable(productData.sku, product.id);
    }

    if (productData.brandId) {
      await this.assertBrandExists(productData.brandId);
    }
    if (productData.shippingMethodId !== undefined) {
      if (productData.shippingMethodId) {
        await this.assertShippingMethodExists(productData.shippingMethodId);
      }
    }
    await this.assertSellersExist(sellerIds);

    Object.assign(product, productData);
    if (sellerIds !== undefined) {
      product.sellerIds = [...new Set(sellerIds)];
      if (!product.createdBySellerId && product.sellerIds[0]) {
        product.createdBySellerId = product.sellerIds[0];
      }
    }

    if (productData.approvalStatus !== undefined) {
      if (productData.approvalStatus === 'rejected') {
        const reason = productData.rejectionReason?.trim();
        if (!reason) {
          throw new ApiException(
            'REJECTION_REASON_REQUIRED',
            'برای رد محصول باید دلیل وارد شود',
            HttpStatus.BAD_REQUEST,
          );
        }
        product.approvalStatus = 'rejected';
        product.rejectionReason = reason;
      } else if (productData.approvalStatus === 'approved') {
        product.approvalStatus = 'approved';
        product.rejectionReason = null;
        if (product.status !== 'publish') {
          product.status = 'publish';
        }
      } else {
        product.approvalStatus = 'pending';
        product.rejectionReason = null;
      }
    } else {
      // تغییر محتوا بدون تعیین صریح وضعیت → منتظر تأیید مجدد
      product.approvalStatus = 'pending';
      product.rejectionReason = null;
    }

    try {
      await this.productRepository.save(product);
    } catch (error) {
      this.throwIfDuplicateKey(error);
      throw error;
    }
    if (stock !== undefined) {
      await this.productStockRepository.upsertForProduct(id, stock);
    }
    if (categoryIds !== undefined) {
      await this.categoriesService.assignCategoryIdsToProduct(id, categoryIds);
    }

    const loaded = await this.productRepository.findById(id, true);
    const [response] = await this.toEnrichedProductResponses([loaded!]);
    return response;
  }

  async review(id: string, dto: ReviewProductDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.approvalStatus === 'rejected') {
      const reason = dto.rejectionReason?.trim();
      if (!reason) {
        throw new ApiException(
          'REJECTION_REASON_REQUIRED',
          'برای رد محصول باید دلیل وارد شود',
          HttpStatus.BAD_REQUEST,
        );
      }
      product.approvalStatus = 'rejected';
      product.rejectionReason = reason;
    } else if (dto.approvalStatus === 'approved') {
      product.approvalStatus = 'approved';
      product.rejectionReason = null;
      if (product.status !== 'publish') {
        product.status = 'publish';
      }
    } else {
      product.approvalStatus = 'pending';
      product.rejectionReason = null;
    }

    await this.productRepository.save(product);
    const loaded = await this.productRepository.findById(id, true);
    const [response] = await this.toEnrichedProductResponses([loaded!]);
    return response;
  }

  async remove(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productRepository.remove(product);
    return {};
  }

  findAllBrands() {
    return this.brandRepository
      .findAllActive()
      .then((brands) => brands.map(toBrandResponse));
  }

  private async toEnrichedProductResponses(
    products: Product[],
  ): Promise<ProductResponseDto[]> {
    const attributeIds = [
      ...new Set(products.flatMap((product) => product.attributeIds ?? [])),
    ];
    const priceValueIds = [
      ...new Set(
        products.flatMap((product) => {
          const prices = Array.isArray(product.price)
            ? product.price
            : product.price
              ? [product.price]
              : [];
          return prices.flatMap((item) => item.attributeIds ?? []);
        }),
      ),
    ];
    const sellerIds = [
      ...new Set(
        products.flatMap((product) =>
          product.createdBySellerId ? [product.createdBySellerId] : [],
        ),
      ),
    ];
    const shippingMethodIds = [
      ...new Set(
        products.flatMap((product) =>
          product.shippingMethodId ? [product.shippingMethodId] : [],
        ),
      ),
    ];

    const [attributes, priceValues, sellers, shippingMethods] =
      await Promise.all([
        this.attributeRepository.findByIdsWithValues(attributeIds),
        this.attributeValueRepository.findByIds(priceValueIds),
        this.sellerRepository.findByIds(sellerIds),
        this.shippingMethodRepository.findByIds(shippingMethodIds),
      ]);

    const attributeMap = new Map(
      attributes.map((attribute) => [
        attribute.id,
        toAttributeResponse(attribute, true),
      ]),
    );
    const valueAttributesByAttributeId = new Map(
      attributes.map((attribute) => [
        attribute.id,
        (attribute.values ?? []).map(toAttributeValueResponse),
      ]),
    );
    const attributeValueById = new Map(
      [
        ...attributes.flatMap((attribute) => attribute.values ?? []),
        ...priceValues,
      ].map((value) => [value.id, toAttributeValueResponse(value)]),
    );
    const sellerMap = new Map(
      sellers.map((seller) => [seller.id, toSellerResponse(seller)]),
    );
    const shippingMethodMap = new Map(
      shippingMethods.map((method) => [
        method.id,
        toShippingMethodResponse(method),
      ]),
    );

    return products.map((product) => {
      const productAttributeIds = product.attributeIds ?? [];
      return toProductResponse(product, true, {
        attributes: productAttributeIds
          .map((id) => attributeMap.get(id))
          .filter((item): item is NonNullable<typeof item> => Boolean(item)),
        valueAttributes: productAttributeIds.flatMap(
          (id) => valueAttributesByAttributeId.get(id) ?? [],
        ),
        attributeValueById,
        createdBySeller: product.createdBySellerId
          ? (sellerMap.get(product.createdBySellerId) ?? null)
          : null,
        shippingMethod: product.shippingMethodId
          ? (shippingMethodMap.get(product.shippingMethodId) ?? null)
          : null,
      });
    });
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    if (await this.productRepository.slugExists(slug, excludeId)) {
      throw new ApiException(
        'PRODUCT_SLUG_EXISTS',
        'محصول با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async assertSkuAvailable(sku?: string | null, excludeId?: string) {
    if (sku === undefined || sku === null) return;
    if (await this.productRepository.skuExists(sku, excludeId)) {
      throw new ApiException(
        'PRODUCT_SKU_EXISTS',
        'محصول با این SKU از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }
  }

  private throwIfDuplicateKey(error: unknown): void {
    const err = error as { code?: string | number; errno?: number };
    const isDuplicate =
      err.code === '23505' ||
      err.code === 'ER_DUP_ENTRY' ||
      err.errno === 1062 ||
      String(err.code) === '1062';
    if (!isDuplicate) return;

    const message = String((error as { message?: string }).message ?? '');
    if (message.includes('slug')) {
      throw new ApiException(
        'PRODUCT_SLUG_EXISTS',
        'محصول با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }
    throw new ApiException(
      'PRODUCT_UNIQUE_FIELD_EXISTS',
      'یکی از فیلدهای یکتای محصول از قبل وجود دارد',
      HttpStatus.CONFLICT,
    );
  }

  private async assertBrandExists(brandId: string) {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new ApiException(
        'BRAND_NOT_FOUND',
        'برند یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!brand.isActive) {
      throw new ApiException(
        'BRAND_INACTIVE',
        'برند غیرفعال است',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async assertShippingMethodExists(shippingMethodId: string) {
    const method =
      await this.shippingMethodRepository.findByIdAny(shippingMethodId);
    if (!method) {
      throw new ApiException(
        'SHIPPING_METHOD_NOT_FOUND',
        'روش ارسال یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async assertSellersExist(sellerIds?: string[]) {
    if (!sellerIds?.length) return;
    for (const sellerId of sellerIds) {
      const seller = await this.sellerRepository.findById(sellerId);
      if (!seller) {
        throw new ApiException(
          'SELLER_NOT_FOUND',
          `فروشنده یافت نشد: ${sellerId}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }
}
