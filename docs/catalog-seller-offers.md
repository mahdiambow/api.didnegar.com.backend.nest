# Product → Variant → Seller Offer

Product holds general catalog data. `sku`, `minPrice`, `maxPrice`, `stockStatus`, `isOnSale`, and `variantIds` are no longer Product input/output fields or persisted Product columns. Product does expose `stock`. Product categories and general tax/dimension fields remain supported.

## Variants

`POST /product-variants`:

```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "attributeValueIds": [
    "550e8400-e29b-41d4-a716-446655440040",
    "550e8400-e29b-41d4-a716-446655440041"
  ]
}
```

The IDs must refer to existing attribute values, each with a parent attribute. Only one value per attribute is allowed. Array order does not distinguish combinations. An empty array represents a product with no selectable attributes. Concurrent duplicate creation is serialized per product and returns HTTP 409 for the duplicate.

- `GET /product-variants?productId=...`
- `GET /product-variants/by-product/:productId`
- `GET /product-variants/:id`
- `PATCH /product-variants/:id` replaces `attributeValueIds` atomically.
- `DELETE /product-variants/:id`

Reads require JWT. Writes require admin or super-admin. A variant with offers cannot change its combination or be deleted. `productId` cannot be reassigned through PATCH. The former `/product-attributes` and standalone `/product-attribute-variants` routes are retired; combination changes go through Variant CRUD.

`product_variants` stores `id` and `product_id`. `variant_attribute_values` holds `variant_id` and `attribute_value_id`, retaining existing link IDs and creation timestamps.

## Seller offers

`POST /seller-offers`:

```json
{
  "sellerId": "550e8400-e29b-41d4-a716-446655440001",
  "variantId": "550e8400-e29b-41d4-a716-446655440030",
  "sku": "SAM-S24U-256-BLU",
  "price": 68000000,
  "stock": 10,
  "stockStatus": "instock",
  "isOnSale": false,
  "taxStatus": "taxable",
  "taxClass": "standard",
  "isActive": true
}
```

- `GET /seller-offers` supports `sellerId`, `variantId`, `productId`, `isActive`, `page`, and `limit`. Prices sort ascending; zero-stock offers remain visible.
- `GET /seller-offers/:id`
- `PATCH /seller-offers/:id` changes commercial fields; seller and variant identity cannot be reassigned.
- `DELETE /seller-offers/:id` returns 409 if used by an order; deactivate it instead.

Reads are public. Writes require JWT and a seller/admin belonging to the owning seller, or super-admin. There is one offer per seller/variant and SKU is unique within a seller. Different sellers may reuse the same SKU.

Stock statuses: `instock`, `outofstock`, `onbackorder`. Checkout currently accepts only `instock` offers with sufficient quantity, an active seller, an active offer, a published product, and a positive price. This change validates available stock; it does not introduce stock reservation or decrement on payment.

## Orders, shipping and price spreadsheets

New order items select an offer:

```json
{
  "products": [
    { "offerId": "550e8400-e29b-41d4-a716-446655440060", "quantity": 2 }
  ],
  "shippingMethodId": "550e8400-e29b-41d4-a716-446655440070"
}
```

Order items snapshot `offerId`, `productId`, `variantId`, `sellerId`, `sku`, `quantity`, and `unitPrice`. Historical orders retain their saved amounts and have null offer/seller metadata. Shipping-only edits use the saved item prices. Shipping fees retain the existing once-per-order calculation.

`GET /shipping/quote?offerId=...&quantity=2&shippingMethodId=...` now quotes the selected offer.

Price management moved from `/products/prices` to `/seller-offers/prices`:

- `POST /adjust`: `{ "offerIds": ["..."], "adjustmentType": "percentage", "direction": "increase", "value": 10 }`.
- `GET /export`, `GET /template`, `POST /import` (multipart `file`).
- Excel columns are `offerId`, `sellerId`, `sku`, `price`. Updates identify rows by `offerId`; seller and SKU are informational. Every targeted offer is authorized before any prices are saved. Invalid rows abort the import.

## Migration and verification

`1788700000000-SeparateSellerOffers` archives old product and variant records in `catalog_products_legacy_archive` and `catalog_variants_legacy_archive`, then removes the obsolete fields and adds offers and order snapshot columns. It does not infer a seller from legacy prices. Map those archived records to real sellers explicitly before relying on them for checkout. Existing seed fixtures create offers only for the known demo seller `didnegar-shop`.

Rollback restores archived columns; it refuses to run after new offers or new variants exist, avoiding silent loss of the new commerce data. Migrations run automatically on application startup in this project.

Checks:

```sh
npm run build
npm test
TEST_PG_SOCKET=/tmp/catalog-offers-db-20260906 node test/catalog-offers.integration.mjs
```

The catalog integration test is currently disabled pending a MariaDB rewrite.
