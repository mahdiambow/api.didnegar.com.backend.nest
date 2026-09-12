import { OffersModule } from './offers/offers.module.js';
import { OfferProductsModule } from './offer-products/offer-products.module.js';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
import { SellersModule } from './sellers/sellers.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ShippingModule } from './shipping/shipping.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { AttributesModule } from './attributes/attributes.module.js';
import { BrandsModule } from './brands/brands.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { MediaModule } from './media/media.module.js';
import { DatabaseSeedModule } from './database/database.seed.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule,
    RolesModule,
    UsersModule,
    SellersModule,
    LocationsModule,
    ProductsModule,
    BrandsModule,
    OffersModule,
    OfferProductsModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    CategoriesModule,
    AttributesModule,
    SettingsModule,
    MediaModule,
    DatabaseSeedModule,
  ],
})
export class AppModule {}
