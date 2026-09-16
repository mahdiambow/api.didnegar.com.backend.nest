import { OffersModule } from './offers/offers.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';
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
import { UlidSubscriber } from './common/id/ulid.subscriber.js';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module.js';
import { CreditModule } from './credit/credit.module.js';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get('DB_HOST'),
        port: config.getNumber('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        charset: 'utf8mb4',
        autoLoadEntities: true,
        subscribers: [UlidSubscriber],
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    AuthModule,
    RolesModule,
    UsersModule,
    SellersModule,
    LocationsModule,
    ProductsModule,
    BrandsModule,
    OffersModule,
    ShoppingCartModule,
    CreditModule,
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
