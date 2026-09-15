import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { CategoriesService } from './categories.service.js';
import { MenuParentCategoryDto } from './dto/menu-response.dto.js';

const MenuApiResponseDto = createSuccessResponseDto(MenuParentCategoryDto, {
  code: 'MENU_FOUND',
  message: 'Menu retrieved successfully',
  name: 'Menu',
  isArray: true,
});

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'MENU_FOUND',
    message: 'Menu retrieved successfully',
  })
  @ApiOperation({
    summary: 'منوی دسته‌بندی‌ها (۳ سطح)',
    description:
      'سطح ۱ parentCategories ← سطح ۲ categories ← سطح ۳ subCategories (فقط فعال‌ها)',
  })
  @ApiOkResponse({ type: MenuApiResponseDto })
  getMenu() {
    return this.categoriesService.getMenu();
  }
}
