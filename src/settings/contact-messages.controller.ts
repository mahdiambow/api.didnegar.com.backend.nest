import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { RequireRole } from '../auth/decorators/require-role.decorator.js';
import { DEFAULT_ROLE_SLUGS } from '../roles/permissions.js';
import { ApiResponseMeta } from '../common/decorators/api-response.decorator.js';
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { createPaginatedResponseDto } from '../common/response/dto/create-paginated-response.dto.js';
import {
  ContactMessageResponseDto,
  CreateContactMessageDto,
  ListContactMessagesQueryDto,
  UpdateContactMessageDto,
} from './dto/contact-message.dto.js';
import { ContactMessagesService } from './contact-messages.service.js';

const ContactMessageApiResponseDto = createSuccessResponseDto(
  ContactMessageResponseDto,
  {
    code: 'CONTACT_MESSAGE_FOUND',
    message: 'Contact message retrieved successfully',
    name: 'ContactMessage',
  },
);

const ContactMessagesApiResponseDto = createPaginatedResponseDto(
  ContactMessageResponseDto,
  {
    code: 'CONTACT_MESSAGES_FOUND',
    message: 'Contact messages retrieved successfully',
    name: 'ContactMessages',
  },
);

@ApiTags('Contact Us')
@Controller('contact-messages')
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'ارسال پیام تماس با ما (عمومی)',
  })
  @ApiResponseMeta({
    code: 'CONTACT_MESSAGE_CREATED',
    message: 'Contact message submitted successfully',
  })
  @ApiCreatedResponse({ type: ContactMessageApiResponseDto })
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactMessagesService.create(dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'لیست پیام‌های دریافتی' })
  @ApiResponseMeta({
    code: 'CONTACT_MESSAGES_FOUND',
    message: 'Contact messages retrieved successfully',
  })
  @ApiOkResponse({ type: ContactMessagesApiResponseDto })
  findAll(@Query() query: ListContactMessagesQueryDto) {
    return this.contactMessagesService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'دریافت یک پیام' })
  @ApiResponseMeta({
    code: 'CONTACT_MESSAGE_FOUND',
    message: 'Contact message found successfully',
  })
  @ApiOkResponse({ type: ContactMessageApiResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactMessagesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'ویرایش پیام (خوانده‌شده، یادداشت داخلی، پاسخ)',
  })
  @ApiResponseMeta({
    code: 'CONTACT_MESSAGE_UPDATED',
    message: 'Contact message updated successfully',
  })
  @ApiOkResponse({ type: ContactMessageApiResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactMessageDto,
  ) {
    return this.contactMessagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole(DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف پیام' })
  @ApiResponseMeta({
    code: 'CONTACT_MESSAGE_DELETED',
    message: 'Contact message deleted successfully',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactMessagesService.remove(id);
  }
}
