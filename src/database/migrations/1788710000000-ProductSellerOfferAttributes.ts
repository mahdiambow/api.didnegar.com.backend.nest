import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductSellerOfferAttributes1788710000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE seller_offers ADD COLUMN "productId" uuid,
      ADD COLUMN attributes jsonb NOT NULL DEFAULT '{}'::jsonb`);
    // Attribute names identify the feature; detached legacy values retain their ID.
    await q.query(`UPDATE seller_offers o SET "productId" = v.product_id,
      attributes = COALESCE((SELECT jsonb_object_agg(COALESCE(a.name, av.id::text), av.value ORDER BY av.id)
        FROM variant_attribute_values link
        JOIN attribute_values av ON av.id = link.attribute_value_id
        LEFT JOIN attributes a ON a.id = av."attributeId"
        WHERE link.variant_id = v.id), '{}'::jsonb)
      FROM product_variants v WHERE v.id = o."variantId"`);
    await q.query(`ALTER TABLE seller_offers ALTER COLUMN "productId" SET NOT NULL,
      ADD CONSTRAINT "FK_offer_product" FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE RESTRICT`);
    await q.query(
      `CREATE INDEX "IDX_offer_product" ON seller_offers ("productId")`,
    );
    await q.query(
      `ALTER TABLE order_items ADD COLUMN attributes jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await q.query(
      `UPDATE order_items i SET attributes = o.attributes FROM seller_offers o WHERE i."offerId" = o.id`,
    );
    // Preserve legacy IDs for historical inspection without exposing them in the API.
    await q.query(
      `ALTER TABLE seller_offers RENAME COLUMN "variantId" TO "legacyVariantId"`,
    );
    await q.query(
      `ALTER TABLE seller_offers ALTER COLUMN "legacyVariantId" DROP NOT NULL`,
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration cannot be automatically reverted: new offers have no legacy variant. Restore a pre-migration backup.',
    );
  }
}
