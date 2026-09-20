import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../utils/auth/guards/role.guard.js';
import { RequireRole } from '../utils/auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { CategoriesService } from './categories.service.js';
import {
  ListMenuQueryDto,
  MenuParentCategoryDto,
} from './dto/menu-response.dto.js';

const MenuApiResponseDto = createSuccessResponseDto(MenuParentCategoryDto, {
  code: 'MENU_FOUND',
  message: 'Menu retrieved successfully',
  name: 'Menu',
  isArray: true,
});

const AdminMenuPaginatedApiResponseDto = createPaginatedResponseDto(
  MenuParentCategoryDto,
  {
    code: 'MENU_FOUND',
    message: 'Menu retrieved successfully',
    name: 'AdminMenu',
  },
);

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
    summary: 'Category menu (3 levels)',
    description:
      'منوی دسته‌بندی‌ها (۳ سطح)\n\nسطح ۱ parentCategories ← سطح ۲ categories ← سطح ۳ subCategories (فقط فعال‌ها)',
  })
  @ApiOkResponse({ type: MenuApiResponseDto })
  getMenu() {
    return this.categoriesService.getMenu();
  }
}

@ApiTags('Menu')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
@Controller('admin/menu')
export class AdminMenuController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'MENU_FOUND',
    message: 'Menu retrieved successfully',
  })
  @ApiOperation({
    summary: 'Category menu for admin (3 levels, paginated)',
    description:
      'منوی دسته‌بندی‌ها برای ادمین — pagination روی parent categories',
  })
  @ApiOkResponse({ type: AdminMenuPaginatedApiResponseDto })
  getMenu(@Query() query: ListMenuQueryDto) {
    return this.categoriesService.getMenuPaginated(query);
  }
}
