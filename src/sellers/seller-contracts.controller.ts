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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { PERMISSIONS } from '../roles/permissions.js';
import { SellerContractsService } from './seller-contracts.service.js';
import { CreateSellerContractDto } from './dto/create-seller-contract.dto.js';
import { UpdateSellerContractDto } from './dto/update-seller-contract.dto.js';
import { SellerContractResponseDto } from './dto/seller-contract-response.dto.js';
import { ListSellerContractsQueryDto } from './dto/list-seller-contracts-query.dto.js';

const ContractApiResponseDto = createSuccessResponseDto(
  SellerContractResponseDto,
  {
    code: 'CONTRACT_FOUND',
    message: 'Contract retrieved successfully',
    name: 'SellerContract',
  },
);

const ContractsPaginatedApiResponseDto = createPaginatedResponseDto(
  SellerContractResponseDto,
  {
    code: 'CONTRACTS_FOUND',
    message: 'Contracts retrieved successfully',
    name: 'SellerContracts',
  },
);

@ApiTags('Seller Contracts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('seller-contracts')
export class SellerContractsController {
  constructor(private readonly contractsService: SellerContractsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.contracts.read)
  @ApiResponseMeta({
    code: 'CONTRACTS_FOUND',
    message: 'Contracts retrieved successfully',
  })
  @ApiOperation({ summary: 'لیست قراردادهای فروشنده' })
  @ApiOkResponse({ type: ContractsPaginatedApiResponseDto })
  findAll(
    @Req() req: { user: AuthUser },
    @Query() query: ListSellerContractsQueryDto,
  ) {
    return this.contractsService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.contracts.read)
  @ApiResponseMeta({
    code: 'CONTRACT_FOUND',
    message: 'Contract retrieved successfully',
  })
  @ApiOperation({ summary: 'دریافت یک قرارداد' })
  @ApiOkResponse({ type: ContractApiResponseDto })
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.contractsService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.contracts.create)
  @ApiResponseMeta({
    code: 'CONTRACT_CREATED',
    message: 'Contract created successfully',
  })
  @ApiOperation({ summary: 'ثبت قرارداد فروشنده (فرم ثابت)' })
  @ApiOkResponse({ type: ContractApiResponseDto })
  create(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateSellerContractDto,
  ) {
    return this.contractsService.create(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.contracts.update)
  @ApiResponseMeta({
    code: 'CONTRACT_UPDATED',
    message: 'Contract updated successfully',
  })
  @ApiOperation({ summary: 'ویرایش قرارداد' })
  @ApiOkResponse({ type: ContractApiResponseDto })
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateSellerContractDto,
  ) {
    return this.contractsService.update(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.contracts.delete)
  @ApiResponseMeta({
    code: 'CONTRACT_DELETED',
    message: 'Contract deleted successfully',
  })
  @ApiOperation({ summary: 'حذف قرارداد' })
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.contractsService.remove(req.user, id);
  }
}
