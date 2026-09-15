import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { SettingsService } from '../settings/settings.service.js';
import { BannersService } from '../settings/banners.service.js';
import { ProductsService } from '../products/products.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { FooterResponseDto } from '../settings/dto/footer.dto.js';
import { HeaderResponseDto } from '../settings/dto/header.dto.js';
import { BannerResponseDto } from '../settings/dto/banner.dto.js';
import { ProductResponseDto } from '../products/dto/product-response.dto.js';
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
});

const PublicProductsApiResponseDto = createSuccessResponseDto(
  ProductResponseDto,
  {
    code: 'PUBLIC_PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
    name: 'PublicProducts',
  },
);

const PublicCategoriesApiResponseDto = createSuccessResponseDto(
  MenuParentCategoryDto,
  {
    code: 'PUBLIC_CATEGORIES_FOUND',
    message: 'Categories retrieved successfully',
    name: 'PublicCategories',
  },
);

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly bannersService: BannersService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get('footer')
  @ApiOperation({ summary: 'فوتر کامل (پابلیک)' })
  @ApiResponseMeta({
    code: 'PUBLIC_FOOTER_FOUND',
    message: 'Footer retrieved successfully',
  })
  @ApiOkResponse({ type: PublicFooterApiResponseDto })
  footer() {
    return this.settingsService.getFooter();
  }

  @Get('header')
  @ApiOperation({ summary: 'هدر کامل (پابلیک)' })
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
    summary: 'همه بنرها (پابلیک)',
    description: 'کل بنرها بدون pagination',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_BANNERS_FOUND',
    message: 'Banners retrieved successfully',
  })
  @ApiOkResponse({ type: PublicBannersApiResponseDto })
  banners() {
    return this.bannersService.findAllPublic();
  }

  @Get('products')
  @ApiOperation({
    summary: 'همه محصولات قابل‌نمایش (پابلیک)',
    description:
      'محصولات publish + approved + active با برند، دسته‌ها، ویژگی‌ها و سایر روابط',
  })
  @ApiResponseMeta({
    code: 'PUBLIC_PRODUCTS_FOUND',
    message: 'Products retrieved successfully',
  })
  @ApiOkResponse({ type: PublicProductsApiResponseDto })
  products() {
    return this.productsService.findAllPublic();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'درخت کامل دسته‌بندی‌ها (پابلیک)',
    description: '۳ سطح: parentCategories → categories → subCategories',
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
