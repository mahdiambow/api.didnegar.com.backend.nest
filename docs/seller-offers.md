# پیشنهاد فروشنده برای محصول

ویژگی‌ها فقط روی **خود محصول** تعریف می‌شوند.
پیشنهاد فروشنده فقط قیمت و موجودی است (بدون `attributes`).

## قوانین تأیید

| تغییر | نتیجه |
|--------|--------|
| فقط `price` / موجودی / فعال‌بودن روی آفر | **فوری** — `approved` |
| تغییر `sku` یا مالیات روی آفر | `pending` تا ادمین تأیید کند |
| هر ویرایش روی محصول | محصول `pending` می‌شود |
| ساخت محصول جدید | همیشه `pending` |

## تعریف ویژگی روی محصول

```json
POST /products
{
  "name": "گوشی Galaxy S24",
  "slug": "galaxy-s24",
  "attributes": {
    "color": ["قرمز", "مشکی"],
    "storage": ["256GB", "512GB"]
  }
}
```

## ثبت قیمت فروشنده

```json
POST /seller-offers
{
  "sellerId": "...",
  "productId": "...",
  "sku": "SAM-S24U-256-BLU",
  "price": 68000000,
  "stockQuantity": 10,
  "stockStatus": "instock",
  "isOnSale": false,
  "isActive": true
}
```

تغییر فقط قیمت (فوری):

```json
PATCH /seller-offers/:id
{ "price": 41000000 }
```
