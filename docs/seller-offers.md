# پیشنهاد فروشنده برای محصول

ویژگی‌ها فقط روی **خود محصول** تعریف می‌شوند.
پیشنهاد فروشنده فقط قیمت و موجودی است.

## ثبت یک یا چند پیشنهاد

```json
POST /seller-offers
{
  "sellerId": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440011",
      "sku": "SAM-S24U-256-BLU",
      "price": 68000000,
      "stockQuantity": 10,
      "stockStatus": "instock",
      "isOnSale": false,
      "isActive": true
    },
    {
      "productId": "550e8400-e29b-41d4-a716-446655440012",
      "sku": "SAM-S24U-512-BLK",
      "price": 72000000,
      "stockQuantity": 5,
      "stockStatus": "instock"
    }
  ]
}
```

حداکثر ۱۰۰ آیتم در هر درخواست. SKUها نباید در همان درخواست تکراری باشند.

تغییر قیمت:

```json
PATCH /seller-offers/:id
{ "price": 41000000 }
```
