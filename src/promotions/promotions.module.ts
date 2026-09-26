import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { Promotion } from './entities/promotion.entity.js';
import { PromotionUsage } from './entities/promotion-usage.entity.js';
import { PromotionRepository } from './repositories/promotion.repository.js';
import { PromotionsService } from './promotions.service.js';
import { PromotionsController } from './promotions.controller.js';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    TypeOrmModule.forFeature([Promotion, PromotionUsage]),
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionRepository],
  exports: [PromotionsService],
})
export class PromotionsModule {}
