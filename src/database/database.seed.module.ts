import { Module } from '@nestjs/common';
import { AuthModule } from '../utils/auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { SellersModule } from '../sellers/sellers.module.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { AttributesModule } from '../attributes/attributes.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { ProductsModule } from '../products/products.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { DepositsModule } from '../deposits/deposits.module.js';
import { DatabaseSeedService } from './database.seed.service.js';

@Module({
  imports: [
    RolesModule,
    AuthModule,
    LocationsModule,
    SellersModule,
    ShippingModule,
    AttributesModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    DepositsModule,
  ],
  providers: [DatabaseSeedService],
})
export class DatabaseSeedModule {}
