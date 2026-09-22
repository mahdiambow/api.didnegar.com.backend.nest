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
  ProductListItemDto,
  ProductPriceResponseDto,
  ProductResponseDto,
} from '../products/dto/product-response.dto.js';
import { ListPublicProductsQueryDto } from '../products/dto/list-public-products-query.dto.js';
import { AttributeValueResponseDto } from '../attributes/dto/attribute-value.dto.js';
import { MenuParentCategoryDto } from '../categories/dto/menu-response.dto.js';
import { MENU_PARENT_CATEGORY_EXAMPLE } from '../categories/dto/category.examples.js';

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
  ProductListItemDto,
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
    example: [MENU_PARENT_CATEGORY_EXAMPLE],
  },
);

@ApiTags('Public')
@ApiExtraModels(
  ProductResponseDto,
  ProductListItemDto,
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
    description: [
      'لیست محصولات قابل‌نمایش (پابلیک)',
      '',
      'فقط `publish` + `approved` + `active` — پاسخ لیست slim (نام/دسته/قیمت/برند/عکس).',
      '',
      '### فیلترها (query)',
      '| پارامتر | مثال | توضیح |',
      '|---|---|---|',
      '| `page` | `1` | شماره صفحه |',
      '| `limit` | `24` | تعداد در صفحه (حداکثر ۳۰۰) |',
      '| `search` | `canon` | جستجو در name / subtitle / slug / sku / shortDescription |',
      '| `name` | `گوشی` | فیلتر نام (LIKE) |',
      '| `brandId` | `01JBRND0000000000000000001` | برند |',
      '| `categoryId` | `01JEX000000000000000000100` | دسته اصلی |',
      '| `subCategoryId` | `01JEX000000000000000000080` | زیردسته |',
      '| `minPrice` | `1000000` | حداقل قیمت پیشنهاد فروش (ریال) |',
      '| `maxPrice` | `50000000` | حداکثر قیمت پیشنهاد فروش (ریال) |',
      '',
      '### نمونه درخواست',
      '```',
      'GET /public/products?page=1&limit=24',
      'GET /public/products?page=1&limit=24&subCategoryId=01JEX000000000000000000080',
      'GET /public/products?search=canon&brandId=01JBRND0000000000000000001',
      'GET /public/products?categoryId=01JEX000000000000000000100&minPrice=1000000&maxPrice=50000000',
      '```',
    ].join('\n'),
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
    description: [
      'درخت کامل دسته‌بندی‌ها (پابلیک) — بدون فیلتر/pagination.',
      '',
      '### ساختار ۳ سطحی',
      '| سطح | فیلد | توضیح |',
      '|---|---|---|',
      '| ۱ | `data[]` | parentCategories |',
      '| ۲ | `data[].categories[]` | categories |',
      '| ۳ | `data[].categories[].subCategories[]` | subCategories |',
      '',
      '### نمونه درخواست',
      '```',
      'GET /public/categories',
      '```',
      '',
      '### نمونه پاسخ (خلاصه)',
      '```json',
      '{',
      '  "code": "PUBLIC_CATEGORIES_FOUND",',
      '  "data": [{',
      '    "id": "01JEX000000000000000000090",',
      '    "name": "کالای دیجیتال",',
      '    "slug": "digital",',
      '    "categories": [{',
      '      "id": "01JEX000000000000000000100",',
      '      "name": "موبایل",',
      '      "slug": "mobile",',
      '      "subCategories": [{',
      '        "id": "01JEX000000000000000000080",',
      '        "name": "گوشی",',
      '        "slug": "phones"',
      '      }]',
      '    }]',
      '  }]',
      '}',
      '```',
      '',
      '### استفاده با محصولات',
      '```',
      'GET /public/products?categoryId=01JEX000000000000000000100',
      'GET /public/products?subCategoryId=01JEX000000000000000000080',
      '```',
    ].join('\n'),
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