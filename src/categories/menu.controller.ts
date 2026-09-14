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
    summary: 'درخت کامل دسته‌بندی‌ها برای منو',
    description:
      'همه parent → category → subCategory های فعال را به‌صورت تو در تو برمی‌گرداند.',
  })
  @ApiOkResponse({ type: MenuApiResponseDto })
  getMenu() {
    return this.categoriesService.getMenu();
  }
}
