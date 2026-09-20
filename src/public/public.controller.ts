import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParseULIDPipe } from '../common/id/index.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { SettingsService } from '../settings/settings.service.js';
import { BannersService } from '../settings/banners.service.js';
import { ProductsService } from '../products/products.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { FooterResponseDto } from '../settings/dto/footer.dto.js';
import { HeaderResponseDto } from '../settings/dto/header.dto.js';
import { BannerResponseDto } from '../settings/dto/banner.dto.js';
import { AboutUsResponseDto } from '../settings/dto/about-us.dto.js';
import { ContactSettingsResponseDto } from '../settings/dto/contact-settings.dto.js';
import {
  ProductPriceResponseDto,
  ProductResponseDto,
} from '../products/dto/product-response.dto.js';
import { ListPublicProductsQueryDto } from '../products/dto/list-public-products-query.dto.js';
import { AttributeValueResponseDto } from '../attributes/dto/attribute-value.dto.js';
import { MenuParentCategoryDto } from '../categories/dto/menu-response.dto.js';

const PublicFooterApiResponseDto = createSuccessResponseDto(FooterResponseDto, {
  code: 'PUBLIC_FOOTER_FOUND',
  message: 'Footer retrieved successfully',
  name: 'PublicFooter',
});

const PublicHeaderApiResponseDto = createSuccessResponseDto(HeaderResponseDto, {
  code: 'PUBLIC_HEADER_FOUND',
  message: 'Header retrieved successfully',
  name: 'PublicHeader',
});

const PublicBannersApiResponseDto = createSuccessResponseDto(BannerResponseDto, {
  code: 'PUBLIC_BANNERS_FOUND',
  message: 'Banners retrieved successfully',
  name: 'PublicBanners',
  isArray: true,
});

const PublicAboutUsApiResponseDto = createSuccessResponseDto(AboutUsResponseDto, {
  code: 'PUBLIC_ABOUT_US_FOUND',
  message: 'About us retrieved successfully',
  name: 'PublicAboutUs',
});

const PublicContactUsApiResponseDto = createSuccessResponseDto(
  ContactSettingsResponseDto,
  {
    code: 'PUBLIC_CONTACT_US_FOUND',
    message: 'Contact us retrieved successfully',
    name: 'PublicContactUs',
  },
);

const PublicProductsPaginatedApiResponseDto = createPaginatedResponseDto(
  ProductResponseDto,
  {
    code: 'PUBLIC_PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
    name: 'PublicProducts',
  },
);

const PublicProductApiResponseDto = createSuccessResponseDto(ProductResponseDto, {
  code: 'PUBLIC_PRODUCT_FOUND',
  message: 'Product retrieved successfully',
  name: 'PublicProduct',
});

const PublicCategoriesApiResponseDto = createSuccessResponseDto(
  MenuParentCategoryDto,
  {
    code: 'PUBLIC_CATEGORIES_FOUND',
    message: 'Categories retrieved successfully',
    name: 'PublicCategories',
    isArray: true,
  },
);

@ApiTags('Public')
@ApiExtraModels(
  ProductResponseDto,
  ProductPriceResponseDto,
  AttributeValueResponseDto,
)
@Controller('public')
export class PublicController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly bannersService: BannersService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get('footer')
  @ApiOperation({ summary: 'Full footer (public)', description: 'فوتر کامل (پابلیک)' })
  @ApiResponseMeta({
    code: 'PUBLIC_FOOTER_FOUND',
    message: 'Footer retrieved successfully',
  })
  @ApiOkResponse({ type: PublicFooterApiResponseDto })
  footer() {
    return this.settingsService.getFooter();
  }

  @Get('header')
  @ApiOperation({ summary: 'Full header (public)', description: 'هدر کامل (پابلیک)' })
  @ApiResponseMeta({
    code: 'PUBLIC_HEADER_FOUND',
    message: 'Header retrieved successfully',
  })
  @ApiOkResponse({ type: PublicHeaderApiResponseDto })
  header() {
    return this.settingsService.getHeader();
  }

  @Get('banners')
  @ApiOperation({
    summary: 'All banners (public)',
    description: 'همه بنرها (پابلیک)\n\nکل بنرها بدون pagination',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_BANNERS_FOUND',
    message: 'Banners retrieved successfully',
  })
  @ApiOkResponse({ type: PublicBannersApiResponseDto })
  banners() {
    return this.bannersService.findAllPublic();
  }

  @Get('about-us')
  @ApiOperation({
    summary: 'About us (public)',
    description: 'درباره ما (پابلیک)',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_ABOUT_US_FOUND',
    message: 'About us retrieved successfully',
  })
  @ApiOkResponse({ type: PublicAboutUsApiResponseDto })
  aboutUs() {
    return this.settingsService.getAboutUs();
  }

  @Get('contact-us')
  @ApiOperation({
    summary: 'Contact us settings (public)',
    description: 'تنظیمات تماس با ما (پابلیک)',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_CONTACT_US_FOUND',
    message: 'Contact us retrieved successfully',
  })
  @ApiOkResponse({ type: PublicContactUsApiResponseDto })
  contactUs() {
    return this.settingsService.getContactSettings();
  }

  @Get('products')
  @ApiOperation({
    summary: 'List visible products (public)',
    description:
      'لیست محصولات قابل‌نمایش (پابلیک)\n\npagination + فیلتر search / name / brandId / categoryId / subCategoryId — فقط publish + approved + active با فیلدهای کامل',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
  })
  @ApiOkResponse({ type: PublicProductsPaginatedApiResponseDto })
  products(@Query() query: ListPublicProductsQueryDto) {
    return this.productsService.findAllPublic(query);
  }

  @Get('products/:id')
  @ApiOperation({
    summary: 'Get one visible product (public)',
    description:
      'یک محصول قابل‌نمایش (پابلیک)\n\nفقط اگر publish + approved + active باشد — با فیلدهای کامل',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_PRODUCT_FOUND',
    message: 'Product retrieved successfully',
  })
  @ApiOkResponse({ type: PublicProductApiResponseDto })
  product(@Param('id', ParseULIDPipe) id: string) {
    return this.productsService.findOnePublic(id);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Full category tree (public)',
    description: 'درخت کامل دسته‌بندی‌ها (پابلیک)\n\n۳ سطح: parentCategories → categories → subCategories',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_CATEGORIES_FOUND',
    message: 'Categories retrieved successfully',
  })
  @ApiOkResponse({ type: PublicCategoriesApiResponseDto })
  categories() {
    return this.categoriesService.getMenu();
  }
}
