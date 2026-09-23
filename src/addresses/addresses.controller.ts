import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { createSuccessResponseDto } from '../common/response/dto/create-success-response.dto.js';
import { JwtAuthGuard } from '../utils/auth/guards/jwt-auth.guard.js';
import { UserAddressResponseDto } from '../utils/auth/dto/user-response.dto.js';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js';

const AddressApiDto = createSuccessResponseDto(UserAddressResponseDto, {
  code: 'ADDRESS_FOUND',
  message: 'Address retrieved successfully',
  name: 'Address',
});

const AddressListApiDto = createSuccessResponseDto(UserAddressResponseDto, {
  code: 'ADDRESSES_FOUND',
  message: 'Addresses retrieved successfully',
  name: 'AddressList',
  isArray: true,
});

@ApiTags('Addresses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiResponseMeta({
    code: 'ADDRESSES_FOUND',
    message: 'Addresses retrieved successfully',
  })
  @ApiOperation({
    summary: 'List user addresses',
    description: 'لیست آدرس‌های کاربر',
  })
  @ApiOkResponse({ type: AddressListApiDto })
  findAll(@Req() req: { user: { sub: string } }) {
    return this.addressesService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiResponseMeta({
    code: 'ADDRESS_FOUND',
    message: 'Address retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get address by id',
    description: 'دریافت یک آدرس',
  })
  @ApiOkResponse({ type: AddressApiDto })
  findOne(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.addressesService.findOne(req.user.sub, id);
  }

  @Post()
  @ApiResponseMeta({
    code: 'ADDRESS_CREATED',
    message: 'Address created successfully',
  })
  @ApiOperation({
    summary: 'Create address',
    description: 'ثبت آدرس جدید برای کاربر',
  })
  @ApiOkResponse({ type: AddressApiDto })
  create(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @ApiResponseMeta({
    code: 'ADDRESS_UPDATED',
    message: 'Address updated successfully',
  })
  @ApiOperation({
    summary: 'Update address',
    description: 'ویرایش آدرس',
  })
  @ApiOkResponse({ type: AddressApiDto })
  update(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @ApiResponseMeta({
    code: 'ADDRESS_DELETED',
    message: 'Address deleted successfully',
  })
  @ApiOperation({
    summary: 'Delete address',
    description: 'حذف آدرس',
  })
  remove(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.addressesService.remove(req.user.sub, id);
  }
}
