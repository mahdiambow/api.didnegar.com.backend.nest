import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { UserProfile } from '../auth/entities/user-profile.entity.js';
import { UserAddress } from '../auth/entities/user-address.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { SellersModule } from '../sellers/sellers.module.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { AttributesModule } from '../attributes/attributes.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { ProductsModule } from '../products/products.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { DatabaseSeedService } from './database.seed.service.js';
import { UsersSeedService } from './seeds/users.seed.service.js';
import { LocationsSeedService } from './seeds/locations.seed.service.js';
import { SellersSeedService } from './seeds/sellers.seed.service.js';
import { OrdersSeedService } from './seeds/orders.seed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserAddress]),
    RolesModule,
    AuthModule,
    LocationsModule,
    SellersModule,
    ShippingModule,
    AttributesModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  providers: [
    DatabaseSeedService,
    UsersSeedService,
    LocationsSeedService,
    SellersSeedService,
    OrdersSeedService,
  ],
})
export class DatabaseSeedModule {}
