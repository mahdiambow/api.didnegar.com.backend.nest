// Build first. Uses a disposable database on a local test PostgreSQL socket only.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CreateBrandsProductsAndPayments1756710000000 } from '../dist/database/migrations/1756710000000-CreateBrandsProductsAndPayments.js';
import { CreateProductVariants1756740000000 } from '../dist/database/migrations/1756740000000-CreateProductVariants.js';
import { SeparateSellerOffers1788700000000 } from '../dist/database/migrations/1788700000000-SeparateSellerOffers.js';
import { ProductSellerOfferAttributes1788710000000 } from '../dist/database/migrations/1788710000000-ProductSellerOfferAttributes.js';
import { Product } from '../dist/products/entities/product.entity.js';
import { ProductVariant } from '../dist/products/entities/product-variant.entity.js';
import { Attribute } from '../dist/attributes/entities/attribute.entity.js';
import { AttributeValue } from '../dist/attributes/entities/attribute-value.entity.js';
import { Seller } from '../dist/sellers/entities/seller.entity.js';
import { SellerOffer } from '../dist/offers/entities/seller-offer.entity.js';
import { ProductRepository } from '../dist/products/repositories/product.repository.js';
import { ProductVariantRepository } from '../dist/products/repositories/product-variant.repository.js';
import { ProductVariantsService } from '../dist/products/product-variants.service.js';
import { OffersService } from '../dist/offers/offers.service.js';
import { ProductPricingService } from '../dist/products/product-pricing.service.js';
import { ProductsModule } from '../dist/products/products.module.js';
import { OrdersModule } from '../dist/orders/orders.module.js';
import { OrdersService } from '../dist/orders/orders.service.js';
import { ShippingService } from '../dist/shipping/shipping.service.js';
import { Role } from '../dist/roles/entities/role.entity.js';
import { User } from '../dist/auth/entities/user.entity.js';
import { ShippingMethod } from '../dist/shipping/entities/shipping-method.entity.js';
import { SettingsModule } from '../dist/settings/settings.module.js';

const host = process.env.TEST_PG_SOCKET;
if (!host?.startsWith('/tmp/'))
  throw new Error(
    'TEST_PG_SOCKET must point to a disposable PostgreSQL socket under /tmp',
  );
const options = {
  type: 'postgres',
  host,
  port: 55439,
  username: process.env.USER,
  database: 'postgres',
};
const admin = await new DataSource(options).initialize();
const database = `catalog_test_${Date.now()}`;
await admin.query(`CREATE DATABASE "${database}"`);
const db = new DataSource({
  ...options,
  database,
  entities: ['dist/**/*.entity.js'],
});
try {
  await db.initialize();
  const q = db.createQueryRunner();
  await q.query('CREATE SCHEMA offer_migration_test');
  await q.query('SET search_path TO offer_migration_test');
  const legacyProduct = randomUUID(),
    legacyVariant = randomUUID(),
    legacyOffer = randomUUID(),
    legacyValue = randomUUID(),
    legacyAttribute = randomUUID();
  await q.query(`CREATE TABLE products (id uuid PRIMARY KEY);
    CREATE TABLE product_variants (id uuid PRIMARY KEY, product_id uuid);
    CREATE TABLE attributes (id uuid PRIMARY KEY, name text);
    CREATE TABLE attribute_values (id uuid PRIMARY KEY, "attributeId" uuid, value text);
    CREATE TABLE variant_attribute_values (variant_id uuid, attribute_value_id uuid);
    CREATE TABLE seller_offers (id uuid PRIMARY KEY, "variantId" uuid NOT NULL);
    CREATE TABLE order_items ("offerId" uuid);`);
  await q.query('INSERT INTO products VALUES ($1)', [legacyProduct]);
  await q.query('INSERT INTO product_variants VALUES ($1, $2)', [
    legacyVariant,
    legacyProduct,
  ]);
  await q.query("INSERT INTO attributes VALUES ($1, 'color')", [
    legacyAttribute,
  ]);
  await q.query("INSERT INTO attribute_values VALUES ($1, $2, 'red')", [
    legacyValue,
    legacyAttribute,
  ]);
  await q.query('INSERT INTO variant_attribute_values VALUES ($1, $2)', [
    legacyVariant,
    legacyValue,
  ]);
  await q.query('INSERT INTO seller_offers VALUES ($1, $2)', [
    legacyOffer,
    legacyVariant,
  ]);
  await q.query('INSERT INTO order_items VALUES ($1)', [legacyOffer]);
  await q.startTransaction();
  await new ProductSellerOfferAttributes1788710000000().up(q);
  await q.commitTransaction();
  assert.deepEqual(
    (await q.query('SELECT "productId", attributes FROM seller_offers'))[0],
    { productId: legacyProduct, attributes: { color: 'red' } },
  );
  assert.deepEqual(
    (await q.query('SELECT attributes FROM order_items'))[0].attributes,
    { color: 'red' },
  );
  await q.query(
    'INSERT INTO seller_offers (id, "productId", attributes) VALUES ($1, $2, $3)',
    [randomUUID(), legacyProduct, { color: 'blue' }],
  );
  await q.query('SET search_path TO public');
  await q.query('DROP SCHEMA offer_migration_test CASCADE');

  await q.query('CREATE TABLE users (id uuid PRIMARY KEY)');
  await q.query('CREATE TABLE sellers (id uuid PRIMARY KEY)');
  await new CreateBrandsProductsAndPayments1756710000000().up(q);
  await new CreateProductVariants1756740000000().up(q);
  await q.query('CREATE TABLE order_items (id uuid PRIMARY KEY)');
  const productId = randomUUID(),
    oldVariantId = randomUUID();
  await q.query(
    `INSERT INTO products(id,"legacyId","legacyTable",name,slug,sku,"minPrice","stockQuantity") VALUES ($1,1,'products','Galaxy','galaxy','OLD-P',100,7)`,
    [productId],
  );
  await q.query(
    `INSERT INTO product_variants(id,"legacyId","legacyTable","productId",sku,"minPrice") VALUES ($1,1,'product_variants',$2,'OLD-V',200)`,
    [oldVariantId, productId],
  );
  const migration = new SeparateSellerOffers1788700000000();
  await q.startTransaction();
  await migration.up(q);
  await q.commitTransaction();
  assert.equal(
    (await q.query('SELECT sku FROM catalog_products_legacy_archive'))[0].sku,
    'OLD-P',
  );
  assert.equal(
    (await q.query('SELECT sku FROM catalog_variants_legacy_archive'))[0].sku,
    'OLD-V',
  );
  assert.deepEqual(
    (
      await q.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='product_variants' ORDER BY column_name`,
      )
    ).map((r) => r.column_name),
    ['id', 'product_id'],
  );
  await q.startTransaction();
  await migration.down(q);
  await q.commitTransaction();
  assert.equal((await q.query('SELECT sku FROM products'))[0].sku, 'OLD-P');
  assert.equal(
    Number(
      (await q.query('SELECT "minPrice" FROM product_variants'))[0].minPrice,
    ),
    200,
  );
  await q.startTransaction();
  await migration.up(q);
  await q.commitTransaction();
  await q.release();
  // Fill unrelated baseline tables for ORM/service integration; migration above was tested independently.
  await db.synchronize();
  const variants = new ProductVariantsService(
    new ProductRepository(db.getRepository(Product)),
    new ProductVariantRepository(db.getRepository(ProductVariant)),
    db,
  );
  const aRepo = db.getRepository(Attribute),
    vRepo = db.getRepository(AttributeValue);
  const storage = await aRepo.save(
    aRepo.create({
      legacyId: 1,
      legacyTable: 'attributes',
      name: 'storage',
      label: 'Storage',
    }),
  );
  const color = await aRepo.save(
    aRepo.create({
      legacyId: 2,
      legacyTable: 'attributes',
      name: 'color',
      label: 'Color',
    }),
  );
  const values = [];
  for (const [i, attributeId] of [storage.id, color.id, storage.id].entries())
    values.push(
      await vRepo.save(
        vRepo.create({
          legacyId: i + 1,
          legacyTable: 'attribute_values',
          attributeId,
          slug: `v${i}`,
          value: `v${i}`,
        }),
      ),
    );
  const combination = {
    productId,
    attributeValueIds: [values[0].id, values[1].id],
  };
  const races = await Promise.allSettled([
    variants.create(combination),
    variants.create({
      ...combination,
      attributeValueIds: [...combination.attributeValueIds].reverse(),
    }),
  ]);
  assert.equal(races.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(
    races.filter((r) => r.status === 'rejected')[0].reason.getStatus(),
    409,
  );
  await assert.rejects(
    variants.create({
      productId,
      attributeValueIds: [values[0].id, values[2].id],
    }),
    (e) => e.getStatus() === 422,
  );
  const sRepo = db.getRepository(Seller);
  const sellers = [];
  for (let i = 0; i < 3; i++)
    sellers.push(
      await sRepo.save(
        sRepo.create({
          name: `Seller ${i}`,
          slug: `seller-${i}`,
          businessName: 'Test',
          email: `s${i}@example.com`,
          phone: '02112345678',
        }),
      ),
    );
  const offers = new OffersService(
    db.getRepository(SellerOffer),
    sRepo,
    db.getRepository(Product),
  );
  const created = [];
  for (let i = 0; i < 3; i++)
    created.push(
      await offers.create(
        { sub: 'test', role: 'seller', sellerId: sellers[i].id },
        {
          sellerId: sellers[i].id,
          productId,
          attributes: { color: 'red', storage: '128GB' },
          sku: 'SAME-SKU',
          price: [68000000, 70000000, 65000000][i],
          stockQuantity: [10, 4, 0][i],
          stockStatus: 'instock',
        },
      ),
    );
  assert.equal((await offers.findAll({ productId })).items.length, 3);
  assert.equal(
    (await offers.resolvePurchasable(created[1].offerId, 1)).unitPrice,
    70000000,
  );
  await assert.rejects(
    offers.resolvePurchasable(created[2].offerId, 1),
    (e) => e.getStatus() === 400,
  );
  await assert.rejects(
    offers.create(
      { sub: 'test', role: 'super-admin', sellerId: null },
      {
        sellerId: sellers[0].id,
        productId,
        attributes: { color: 'red', storage: '128GB' },
        sku: 'SAME-SKU',
        price: 1,
        stockQuantity: 1,
        stockStatus: 'instock',
      },
    ),
    (e) => e.getStatus() === 409,
  );
  const differentFeatures = await offers.create(
    { sub: 'test', role: 'seller', sellerId: sellers[0].id },
    {
      sellerId: sellers[0].id,
      productId,
      attributes: { color: 'blue', storage: '256GB' },
      sku: 'BLUE-256',
      price: 72000000,
      stockQuantity: 3,
      stockStatus: 'instock',
    },
  );
  assert.deepEqual(differentFeatures.attributes, {
    color: 'blue',
    storage: '256GB',
  });
  assert.equal(
    (await offers.findAll({ productId, sellerId: sellers[0].id })).items.length,
    2,
  );
  const pricing = new ProductPricingService(db.getRepository(SellerOffer));
  const owner = { sub: 'test', role: 'seller', sellerId: sellers[0].id };
  await assert.rejects(
    pricing.adjustPrices(owner, {
      offerIds: [created[0].offerId, created[1].offerId],
      adjustmentType: 'fixed',
      direction: 'increase',
      value: 10,
    }),
    (e) => e.getStatus() === 403,
  );
  assert.equal((await offers.findOne(created[0].offerId)).price, 68000000);
  await pricing.adjustPrices(owner, {
    offerIds: [created[0].offerId],
    adjustmentType: 'fixed',
    direction: 'increase',
    value: 10,
  });
  assert.equal((await offers.findOne(created[0].offerId)).price, 68000010);
  const buffer = await pricing.buildExportWorkbook(owner, false);
  assert.equal(
    (await pricing.importFromExcel(owner, { buffer: Buffer.from(buffer) }))
      .updatedCount,
    2,
  );
  class TestDatabaseModule {}
  Module({
    providers: [{ provide: DataSource, useValue: db }],
    exports: [DataSource],
  })(TestDatabaseModule);
  const ref = await Test.createTestingModule({
    imports: [
      { module: TestDatabaseModule, global: true },
      ProductsModule,
      OrdersModule,
      SettingsModule,
    ],
  }).compile();
  const role = await db
    .getRepository(Role)
    .save(
      db
        .getRepository(Role)
        .create({ slug: 'test-user', name: 'Test', permissions: [] }),
    );
  const customer = await db
    .getRepository(User)
    .save(
      db
        .getRepository(User)
        .create({ username: '09100000000', roleId: role.id }),
    );
  const shipping = await db.getRepository(ShippingMethod).save(
    db.getRepository(ShippingMethod).create({
      slug: 'test-shipping',
      name: 'Test',
      price: 50,
      isCod: false,
    }),
  );
  const orderService = ref.get(OrdersService),
    shippingService = ref.get(ShippingService);
  const order = await orderService.create(customer.id, {
    products: [
      { offerId: created[0].offerId, quantity: 2 },
      { offerId: created[1].offerId, quantity: 1 },
    ],
    shippingMethodId: shipping.id,
  });
  assert.equal(order.subtotal, 206000020);
  assert.equal(order.amount, 206000070);
  assert.equal(new Set(order.products.map((item) => item.sellerId)).size, 2);
  assert.equal(
    (
      await shippingService.getQuote({
        offerId: created[1].offerId,
        quantity: 2,
        shippingMethodId: shipping.id,
      })
    ).payableAmount,
    140000050,
  );
  await pricing.adjustPrices(owner, {
    offerIds: [created[0].offerId],
    adjustmentType: 'fixed',
    direction: 'increase',
    value: 100,
  });
  const updated = await orderService.updateAdmin(order.id, {
    shippingMethodId: shipping.id,
  });
  assert.equal(updated.subtotal, order.subtotal);
  await assert.rejects(
    offers.remove(owner, created[0].offerId),
    (e) => e.getStatus() === 409,
  );
  const app = ref.createNestApplication();
  const doc = SwaggerModule.createDocument(app, new DocumentBuilder().build());
  for (const path of [
    '/products',
    '/seller-offers',
    '/seller-offers/prices/adjust',
    '/orders',
    '/shipping/quote',
  ])
    assert.ok(doc.paths[path], path);
  for (const field of [
    'sku',
    'minPrice',
    'maxPrice',
    'stockQuantity',
    'stockStatus',
    'isOnSale',
    'variantIds',
  ])
    assert.ok(
      !doc.components.schemas.CreateProductDto.properties[field],
      field,
    );
  for (const path of ['/variants', '/variant-values', '/product-variants'])
    assert.ok(!doc.paths[path], path);
  assert.ok(doc.components.schemas.CreateSellerOfferDto.properties.productId);
  assert.ok(doc.components.schemas.CreateSellerOfferDto.properties.attributes);
  assert.ok(!doc.components.schemas.CreateSellerOfferDto.properties.variantId);
  assert.ok(doc.components.schemas.OrderProductDto.properties.offerId);
  assert.ok(!doc.paths['/product-attribute-variants']);
  await app.close();
  console.log(
    'PASS: migration up/down/up with archives, concurrent combinations, three sellers per product with attributes, stock validation, tenant isolation, price Excel round-trip, real order snapshots and shipping, dependency injection and Swagger.',
  );
} finally {
  if (db.isInitialized) await db.destroy();
  await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.destroy();
}
