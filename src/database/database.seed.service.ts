import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RolesSeedService } from '../roles/roles.seed.service.js';
import { LocationsSeedService } from './seeds/locations.seed.service.js';
import { UsersSeedService } from './seeds/users.seed.service.js';
import { SellersSeedService } from './seeds/sellers.seed.service.js';
import { ShippingSeedService } from '../shipping/shipping.seed.service.js';
import { AttributesSeedService } from '../attributes/attributes.seed.service.js';
import { CategoriesSeedService } from '../categories/categories.seed.service.js';
import { ProductsSeedService } from '../products/products.seed.service.js';
import { OrdersSeedService } from './seeds/orders.seed.service.js';

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    private readonly rolesSeedService: RolesSeedService,
    private readonly locationsSeedService: LocationsSeedService,
    private readonly usersSeedService: UsersSeedService,
    private readonly sellersSeedService: SellersSeedService,
    private readonly shippingSeedService: ShippingSeedService,
    private readonly attributesSeedService: AttributesSeedService,
    private readonly categoriesSeedService: CategoriesSeedService,
    private readonly productsSeedService: ProductsSeedService,
    private readonly ordersSeedService: OrdersSeedService,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_ON_STARTUP === 'false') {
      return;
    }

    await this.seedAll();
  }

  async seedAll() {
    this.logger.log('Seeding initial database data...');

    await this.rolesSeedService.seed();
    await this.locationsSeedService.seed();
    await this.usersSeedService.seed();
    await this.sellersSeedService.seed();
    await this.shippingSeedService.seed();
    await this.attributesSeedService.seed();
    await this.categoriesSeedService.seedCatalog();
    await this.productsSeedService.seed();
    await this.categoriesSeedService.seedProductLinks();
    await this.ordersSeedService.seed();

    this.logger.log('Initial database seed completed.');
  }
}
