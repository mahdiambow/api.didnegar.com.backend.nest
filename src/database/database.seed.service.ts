import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service.js';
import { RolesSeedService } from '../roles/roles.seed.service.js';
import { ShippingSeedService } from '../shipping/shipping.seed.service.js';
import { AttributesSeedService } from '../attributes/attributes.seed.service.js';
import { CategoriesSeedService } from '../categories/categories.seed.service.js';

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly rolesSeedService: RolesSeedService,
    private readonly shippingSeedService: ShippingSeedService,
    private readonly attributesSeedService: AttributesSeedService,
    private readonly categoriesSeedService: CategoriesSeedService,
  ) {}

  async onModuleInit() {
    if (!this.config.getBooleanOptional('SEED_ON_STARTUP', true)) {
      return;
    }

    await this.seedAll();
  }

  async seedAll() {
    this.logger.log('Seeding initial database data...');

    await this.rolesSeedService.seed();
    await this.shippingSeedService.seed();
    await this.attributesSeedService.seed();
    await this.categoriesSeedService.seedCatalog();
    await this.categoriesSeedService.seedProductLinks();

    this.logger.log('Initial database seed completed.');
  }
}
