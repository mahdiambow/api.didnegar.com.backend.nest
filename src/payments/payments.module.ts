import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { ZarinpalMockService } from './services/zarinpal-mock.service.js';
import { PaymentRepository } from './repositories/payment.repository.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    OrdersModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ZarinpalMockService, PaymentRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
