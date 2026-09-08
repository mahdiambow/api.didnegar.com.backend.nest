import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { CategoriesService } from '../categories/categories.service.js';
import { SellerRepository } from '../sellers/repositories/seller.repository.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { toProductEntityData } from './dto/product-fields.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';
import {
  toBrandResponse,
  toProductResponse,
} from './dto/product-response.dto.js';
import { BrandRepository } from './repositories/brand.repository.js';
import { ProductRepository } from './repositories/product.repository.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly sellerRepository: SellerRepository,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    approvalStatus?: string;
    isActive?: boolean;
    brandId?: string;
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
        name: query.name,
        categoryId: query.categoryId,
        subCategoryId: query.subCategoryId,
      },
      true,
    );

    return paginatedList(
      items.map((item) => toProductResponse(item, true)),
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
    return toProductResponse(product, true);
  }

  async create(dto: CreateProductDto) {
    const { categoryIds, sellerIds, ...productData } = dto;

    await this.assertUniqueFields(productData.slug);
    if (productData.brandId) {
      await this.assertBrandExists(productData.brandId);
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
    const product = await this.productRepository.save(
      this.productRepository.create(
        toProductEntityData({ ...productData, sellerIds }, legacyId),
      ),
    );

    await this.categoriesService.assignCategoryIdsToProduct(
      product.id,
      categoryIds ?? [],
    );

    const loaded = await this.productRepository.findById(product.id, true);
    return toProductResponse(loaded!, true);
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

    const { categoryIds, sellerIds, ...productData } = dto;

    if (productData.slug && productData.slug !== product.slug) {
      const slugTaken = await this.productRepository.findBySlug(
        productData.slug,
      );
      if (slugTaken) {
        throw new ApiException(
          'PRODUCT_SLUG_EXISTS',
          'محصول با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (productData.brandId) {
      await this.assertBrandExists(productData.brandId);
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

    await this.productRepository.save(product);
    if (categoryIds !== undefined) {
      await this.categoriesService.assignCategoryIdsToProduct(id, categoryIds);
    }

    const loaded = await this.productRepository.findById(id, true);
    return toProductResponse(loaded!, true);
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
    return toProductResponse(loaded!, true);
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

  private async assertUniqueFields(slug: string) {
    const slugTaken = await this.productRepository.findBySlug(slug);
    if (slugTaken) {
      throw new ApiException(
        'PRODUCT_SLUG_EXISTS',
        'محصول با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }
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
