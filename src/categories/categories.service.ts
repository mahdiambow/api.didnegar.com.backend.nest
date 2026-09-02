import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ProductRepository } from '../products/repositories/product.repository.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { SubCategoryRepository } from './repositories/sub-category.repository.js';
import { ProductCategoryRepository } from './repositories/product-category.repository.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto.js';
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
} from './dto/create-sub-category.dto.js';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  toCategoryResponse,
  toSubCategoryResponse,
  toProductCategoryResponse,
} from './dto/category-response.dto.js';
import { ProductCategoryLinkInput } from './dto/product-category-link.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  findAllCategories() {
    return this.categoryRepository
      .findAll()
      .then((items) => items.map(toCategoryResponse));
  }

  async findCategory(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ApiException(
        'CATEGORY_NOT_FOUND',
        'دسته‌بندی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return toCategoryResponse(category);
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ApiException(
        'CATEGORY_SLUG_EXISTS',
        'دسته‌بندی با این slug از قبل وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const category = await this.categoryRepository.save(
      this.categoryRepository.create(dto),
    );
    return toCategoryResponse(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ApiException(
        'CATEGORY_NOT_FOUND',
        'دسته‌بندی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.slug && dto.slug !== category.slug) {
      const slugTaken = await this.categoryRepository.findBySlug(dto.slug);
      if (slugTaken) {
        throw new ApiException(
          'CATEGORY_SLUG_EXISTS',
          'دسته‌بندی با این slug از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(category, dto);
    return toCategoryResponse(await this.categoryRepository.save(category));
  }

  async removeCategory(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ApiException(
        'CATEGORY_NOT_FOUND',
        'دسته‌بندی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.categoryRepository.remove(category);
    return {};
  }

  async findSubCategoriesByCategory(categoryId: string) {
    await this.assertCategoryExists(categoryId);
    const items = await this.subCategoryRepository.findByCategoryId(categoryId);
    return items.map((item) => toSubCategoryResponse(item));
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    await this.assertCategoryExists(dto.categoryId);

    const existing = await this.subCategoryRepository.findByCategoryAndSlug(
      dto.categoryId,
      dto.slug,
    );
    if (existing) {
      throw new ApiException(
        'SUB_CATEGORY_SLUG_EXISTS',
        'زیردسته با این slug در این دسته وجود دارد',
        HttpStatus.CONFLICT,
      );
    }

    const subCategory = await this.subCategoryRepository.save(
      this.subCategoryRepository.create(dto),
    );
    return toSubCategoryResponse(subCategory);
  }

  async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
    const subCategory = await this.subCategoryRepository.findById(id);
    if (!subCategory) {
      throw new ApiException(
        'SUB_CATEGORY_NOT_FOUND',
        'زیردسته یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.slug && dto.slug !== subCategory.slug) {
      const slugTaken = await this.subCategoryRepository.findByCategoryAndSlug(
        subCategory.categoryId,
        dto.slug,
      );
      if (slugTaken) {
        throw new ApiException(
          'SUB_CATEGORY_SLUG_EXISTS',
          'زیردسته با این slug در این دسته وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(subCategory, dto);
    return toSubCategoryResponse(
      await this.subCategoryRepository.save(subCategory),
    );
  }

  async removeSubCategory(id: string) {
    const subCategory = await this.subCategoryRepository.findById(id);
    if (!subCategory) {
      throw new ApiException(
        'SUB_CATEGORY_NOT_FOUND',
        'زیردسته یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.subCategoryRepository.remove(subCategory);
    return {};
  }

  async findProductCategories(query: {
    page?: string | number;
    limit?: string | number;
    productId?: string;
    categoryId?: string;
    subCategoryId?: string;
  }) {
    const { page, limit, offset } = getPaginationParams(query);
    const [items, total] = await this.productCategoryRepository.findPaginated(
      offset,
      limit,
      {
        productId: query.productId,
        categoryId: query.categoryId,
        subCategoryId: query.subCategoryId,
      },
    );

    return paginatedList(
      items.map(toProductCategoryResponse),
      page,
      limit,
      total,
    );
  }

  async assignProductCategory(dto: CreateProductCategoryDto) {
    await this.assertProductExists(dto.productId);

    const saved = await this.createProductCategoryLink(dto.productId, dto);
    return toProductCategoryResponse(saved);
  }

  async assignProductCategories(
    productId: string,
    links: ProductCategoryLinkInput[],
  ) {
    if (!links.length) {
      return;
    }

    await this.assertProductExists(productId);

    for (const link of links) {
      await this.createProductCategoryLink(productId, link);
    }
  }

  async assignCategoryIdsToProduct(productId: string, categoryIds: string[]) {
    if (!categoryIds.length) {
      return;
    }

    await this.assertProductExists(productId);

    const uniqueIds = [...new Set(categoryIds)];
    for (let index = 0; index < uniqueIds.length; index++) {
      const link = await this.resolveCategoryId(uniqueIds[index]!);
      await this.createProductCategoryLink(productId, {
        ...link,
        position: index,
      });
    }
  }

  private async createProductCategoryLink(
    productId: string,
    link: ProductCategoryLinkInput,
  ) {
    const { categoryId, subCategoryId } =
      await this.resolveCategoryLink(link);

    const duplicate =
      await this.productCategoryRepository.findByProductCategorySubCategory(
        productId,
        categoryId,
        subCategoryId,
      );

    if (duplicate) {
      throw new ApiException(
        'PRODUCT_CATEGORY_EXISTS',
        'این دسته‌بندی قبلاً به محصول اختصاص داده شده',
        HttpStatus.CONFLICT,
      );
    }

    if (link.isPrimary) {
      await this.productCategoryRepository.clearPrimaryForProduct(productId);
    }

    const saved = await this.productCategoryRepository.save(
      this.productCategoryRepository.create({
        productId,
        categoryId,
        subCategoryId,
        isPrimary: link.isPrimary ?? false,
        position: link.position ?? 0,
      }),
    );

    const loaded = await this.productCategoryRepository.findById(saved.id);
    return loaded!;
  }

  async updateProductCategory(id: string, dto: UpdateProductCategoryDto) {
    const link = await this.productCategoryRepository.findById(id);
    if (!link) {
      throw new ApiException(
        'PRODUCT_CATEGORY_NOT_FOUND',
        'ارتباط محصول-دسته یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.categoryId !== undefined || dto.subCategoryId !== undefined) {
      const { categoryId: nextCategoryId, subCategoryId: nextSubCategoryId } =
        await this.resolveCategoryLink({
          categoryId: dto.categoryId ?? link.categoryId ?? undefined,
          subCategoryId:
            dto.subCategoryId !== undefined
              ? dto.subCategoryId
              : (link.subCategoryId ?? undefined),
        });

      const duplicate =
        await this.productCategoryRepository.findByProductCategorySubCategory(
          link.productId,
          nextCategoryId,
          nextSubCategoryId,
        );

      if (duplicate && duplicate.id !== link.id) {
        throw new ApiException(
          'PRODUCT_CATEGORY_EXISTS',
          'این دسته‌بندی قبلاً به محصول اختصاص داده شده',
          HttpStatus.CONFLICT,
        );
      }

      link.categoryId = nextCategoryId;
      link.subCategoryId = nextSubCategoryId;
    }

    if (dto.isPrimary !== undefined) link.isPrimary = dto.isPrimary;
    if (dto.position !== undefined) link.position = dto.position;

    if (dto.isPrimary) {
      await this.productCategoryRepository.clearPrimaryForProduct(
        link.productId,
        link.id,
      );
    }

    const updated = await this.productCategoryRepository.save(link);
    const saved = await this.productCategoryRepository.findById(updated.id);
    return toProductCategoryResponse(saved!);
  }

  async removeProductCategory(id: string) {
    const link = await this.productCategoryRepository.findById(id);
    if (!link) {
      throw new ApiException(
        'PRODUCT_CATEGORY_NOT_FOUND',
        'ارتباط محصول-دسته یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productCategoryRepository.remove(link);
    return {};
  }

  getProductCategoriesByProductId(productId: string) {
    return this.productCategoryRepository
      .findByProductId(productId)
      .then((items) => items.map(toProductCategoryResponse));
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new ApiException(
        'CATEGORY_NOT_FOUND',
        'دسته‌بندی یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return category;
  }

  private async assertProductExists(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        'محصول یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async resolveCategoryId(id: string): Promise<ProductCategoryLinkInput> {
    const subCategory = await this.subCategoryRepository.findById(id);
    if (subCategory) {
      return {
        categoryId: subCategory.categoryId,
        subCategoryId: subCategory.id,
      };
    }

    await this.assertCategoryExists(id);

    return { categoryId: id };
  }

  private async resolveCategoryLink(input: ProductCategoryLinkInput) {
    const { categoryId, subCategoryId } = input;

    if (!categoryId && !subCategoryId) {
      throw new ApiException(
        'PRODUCT_CATEGORY_INVALID',
        'categoryId یا subCategoryId الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (subCategoryId) {
      const subCategory =
        await this.subCategoryRepository.findById(subCategoryId);
      if (!subCategory) {
        throw new ApiException(
          'SUB_CATEGORY_NOT_FOUND',
          'زیردسته یافت نشد',
          HttpStatus.NOT_FOUND,
        );
      }

      if (categoryId && categoryId !== subCategory.categoryId) {
        throw new ApiException(
          'PRODUCT_CATEGORY_MISMATCH',
          'subCategoryId به categoryId تعلق ندارد',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.assertCategoryExists(subCategory.categoryId);

      return {
        categoryId: subCategory.categoryId,
        subCategoryId: subCategory.id,
      };
    }

    await this.assertCategoryExists(categoryId!);

    return {
      categoryId: categoryId!,
      subCategoryId: null,
    };
  }
}
