import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import type { AuthUser } from '../utils/auth/types/auth-user.type.js';
import { UserResponseDto } from '../utils/auth/dto/user-response.dto.js';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';

const UserApiResponseDto = createSuccessResponseDto(UserResponseDto, {
  code: 'USER_FOUND',
  message: 'User retrieved successfully',
  name: 'User',
});

const UsersPaginatedApiResponseDto = createPaginatedResponseDto(
  UserResponseDto,
  {
    code: 'USERS_FOUND',
    message: 'Users retrieved successfully',
    name: 'Users',
  },
);

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiResponseMeta({
    code: 'USERS_FOUND',
    message: 'Users retrieved successfully',
  })
  @ApiOperation({
    summary: 'List users with pagination',
    description: 'لیست کاربران با pagination\n\nفیلتر اختیاری search روی username / displayName / email / firstName / lastName',
  })
  @ApiOkResponse({ type: UsersPaginatedApiResponseDto })
  findAll(@Req() req: { user: AuthUser }, @Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(req.user, query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'USER_FOUND',
    message: 'User retrieved successfully',
  })
  @ApiOperation({ summary: 'Get one user', description: 'دریافت یک کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.usersService.findOne(req.user, id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'USER_CREATED',
    message: 'User created successfully',
  })
  @ApiOperation({ summary: 'Create user', description: 'ایجاد کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user, dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'USER_UPDATED',
    message: 'User updated successfully',
  })
  @ApiOperation({ summary: 'Update user', description: 'ویرایش کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'USER_DELETED',
    message: 'User deleted successfully',
  })
  @ApiOperation({ summary: 'Delete user', description: 'حذف کاربر' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.usersService.remove(req.user, id);
  }
}
