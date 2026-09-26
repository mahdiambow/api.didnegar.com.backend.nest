import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { ProductsModule } from '../products/products.module.js';
import { OffersModule } from '../offers/offers.module.js';
import { Review } from './entities/review.entity.js';
import { ReviewRepository } from './repositories/review.repository.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => OffersModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewRepository],
  exports: [ReviewsService, ReviewRepository],
})
export class ReviewsModule {}
