import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserResponseDto } from '../auth/dto/user-response.dto.js';
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
  @ApiOperation({ summary: 'لیست کاربران با pagination' })
  @ApiOkResponse({ type: UsersPaginatedApiResponseDto })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'USER_FOUND',
    message: 'User retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'USER_CREATED',
    message: 'User created successfully',
  })
  @ApiOperation({ summary: 'ایجاد کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'USER_UPDATED',
    message: 'User updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش کاربر' })
  @ApiOkResponse({ type: UserApiResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'USER_DELETED',
    message: 'User deleted successfully',
  })
  @ApiOperation({ summary: 'حذف کاربر' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
