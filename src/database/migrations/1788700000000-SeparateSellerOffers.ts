import { MigrationInterface, QueryRunner } from 'typeorm';

const productColumns: Record<string, string> = {
  sku: 'varchar(100)',
  minPrice: 'numeric(19,4)',
  maxPrice: 'numeric(19,4)',
  stockQuantity: 'integer',
  stockStatus: 'varchar(50)',
  isOnSale: 'boolean NOT NULL DEFAULT false',
};
const variantColumns: Record<string, string> = {
  legacyId: 'bigint',
  legacyTable: 'varchar(255)',
  sku: 'varchar(100)',
  minPrice: 'numeric(19,4)',
  maxPrice: 'numeric(19,4)',
  isVirtual: 'boolean NOT NULL DEFAULT false',
  isDownloadable: 'boolean NOT NULL DEFAULT false',
  stockQuantity: 'integer',
  stockStatus: 'varchar(50)',
  taxStatus: 'varchar(50)',
  taxClass: 'varchar(100)',
  description: 'text',
  status: "varchar(50) NOT NULL DEFAULT 'publish'",
  weight: 'numeric(10,2)',
  length: 'numeric(10,2)',
  width: 'numeric(10,2)',
  height: 'numeric(10,2)',
  isActive: 'boolean NOT NULL DEFAULT true',
  createdAt: 'TIMESTAMP NOT NULL DEFAULT now()',
  updatedAt: 'TIMESTAMP NOT NULL DEFAULT now()',
};

export class SeparateSellerOffers1788700000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    // No seller ownership exists on legacy product prices. Preserve the source for explicit mapping.
    await q.query(
      'CREATE TABLE catalog_products_legacy_archive AS TABLE products',
    );
    await q.query(
      'CREATE TABLE catalog_variants_legacy_archive AS TABLE product_variants',
    );
    for (const column of Object.keys(productColumns))
      await q.query(`ALTER TABLE products DROP COLUMN "${column}"`);
    for (const column of Object.keys(variantColumns))
      await q.query(`ALTER TABLE product_variants DROP COLUMN "${column}"`);
    await q.query(
      'ALTER TABLE product_variants RENAME COLUMN "productId" TO product_id',
    );
    await q.query(
      'ALTER TABLE product_variant_attributes RENAME TO variant_attribute_values',
    );
    await q.query(
      'ALTER TABLE variant_attribute_values RENAME COLUMN "variantId" TO variant_id',
    );
    await q.query(
      'ALTER TABLE variant_attribute_values RENAME COLUMN "attributeValueId" TO attribute_value_id',
    );
    await q.query(`CREATE TABLE seller_offers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sellerId" uuid NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
      "variantId" uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
      sku varchar(100) NOT NULL,
      price numeric(19,4) NOT NULL CONSTRAINT "CHK_offer_price" CHECK (price >= 0),
      "stockQuantity" integer NOT NULL DEFAULT 0 CONSTRAINT "CHK_offer_stock" CHECK ("stockQuantity" >= 0),
      "stockStatus" varchar(50) NOT NULL DEFAULT 'outofstock',
      "isOnSale" boolean NOT NULL DEFAULT false,
      "taxStatus" varchar(50), "taxClass" varchar(100),
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      UNIQUE ("sellerId", "variantId"), UNIQUE ("sellerId", sku)
    )`);
    await q.query(
      'CREATE INDEX "IDX_seller_offers_variant" ON seller_offers ("variantId")',
    );
    await q.query(`ALTER TABLE order_items
      ADD COLUMN "offerId" uuid REFERENCES seller_offers(id) ON DELETE RESTRICT,
      ADD COLUMN "variantId" uuid,
      ADD COLUMN "sellerId" uuid,
      ADD COLUMN sku varchar(100)`);
    await q.query(
      'CREATE INDEX "IDX_order_items_offer" ON order_items ("offerId")',
    );
  }

  async down(q: QueryRunner): Promise<void> {
    const incompatible = await q.query(`SELECT 1 FROM seller_offers
      UNION ALL SELECT 1 FROM product_variants v WHERE NOT EXISTS (SELECT 1 FROM catalog_variants_legacy_archive a WHERE a.id = v.id) LIMIT 1`);
    if (incompatible.length)
      throw new Error(
        'Cannot revert seller offers after new offers or variants exist. Export and map the new data before rollback.',
      );
    await q.query(
      'ALTER TABLE order_items DROP COLUMN "offerId", DROP COLUMN "variantId", DROP COLUMN "sellerId", DROP COLUMN sku',
    );
    await q.query('DROP TABLE seller_offers');
    await q.query(
      'ALTER TABLE variant_attribute_values RENAME COLUMN variant_id TO "variantId"',
    );
    await q.query(
      'ALTER TABLE variant_attribute_values RENAME COLUMN attribute_value_id TO "attributeValueId"',
    );
    await q.query(
      'ALTER TABLE variant_attribute_values RENAME TO product_variant_attributes',
    );
    await q.query(
      'ALTER TABLE product_variants RENAME COLUMN product_id TO "productId"',
    );
    for (const [column, type] of Object.entries(productColumns))
      await q.query(`ALTER TABLE products ADD COLUMN "${column}" ${type}`);
    for (const [column, type] of Object.entries(variantColumns))
      await q.query(
        `ALTER TABLE product_variants ADD COLUMN "${column}" ${type}`,
      );
    for (const [table, archive, columns] of [
      ['products', 'catalog_products_legacy_archive', productColumns],
      ['product_variants', 'catalog_variants_legacy_archive', variantColumns],
    ] as const) {
      await q.query(
        `UPDATE ${table} t SET ${Object.keys(columns)
          .map((c) => `"${c}" = a."${c}"`)
          .join(', ')} FROM ${archive} a WHERE a.id = t.id`,
      );
    }
    await q.query(
      'ALTER TABLE product_variants ALTER COLUMN "legacyId" SET NOT NULL, ALTER COLUMN "legacyTable" SET NOT NULL',
    );
    await q.query(
      'CREATE UNIQUE INDEX "IDX_products_sku" ON products(sku) WHERE sku IS NOT NULL',
    );
    await q.query(
      'CREATE INDEX "IDX_products_stock_status" ON products("stockStatus")',
    );
    await q.query(
      'CREATE INDEX "IDX_products_on_sale" ON products("isOnSale")',
    );
    await q.query(
      'CREATE UNIQUE INDEX "IDX_product_variants_legacySource" ON product_variants("legacyTable", "legacyId")',
    );
    await q.query(
      'CREATE UNIQUE INDEX "IDX_product_variants_sku" ON product_variants(sku) WHERE sku IS NOT NULL',
    );
    await q.query(
      'CREATE INDEX "IDX_product_variants_stockStatus" ON product_variants("stockStatus")',
    );
    await q.query(
      'DROP TABLE catalog_products_legacy_archive, catalog_variants_legacy_archive',
    );
  }
}
