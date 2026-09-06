# پیشنهاد فروشنده برای محصول

ویژگی‌ها روی **خود محصول** تعریف می‌شوند. فروشنده فقط از همان گزینه‌ها انتخاب
می‌کند و قیمت می‌گذارد.

## قوانین تأیید

| تغییر | نتیجه |
|--------|--------|
| فقط `price` / موجودی / فعال‌بودن روی آفر | **فوری** — `approvalStatus=approved` |
| تغییر `attributes` یا `sku` روی آفر | `pending` تا ادمین تأیید کند |
| هر ویرایش روی خود محصول (`PATCH /products/:id`) | محصول `pending` می‌شود |
| ساخت محصول جدید | همیشه `pending` |

### تأیید ادمین

```http
PATCH /products/:id/approval
{ "approvalStatus": "approved" }
```

```http
PATCH /seller-offers/:id/approval
{ "approvalStatus": "approved" }
```

رد:

```http
PATCH /seller-offers/:id/approval
{
  "approvalStatus": "rejected",
  "rejectionReason": "SKU نادرست است"
}
```

خرید فقط وقتی ممکن است که هم محصول و هم آفر `approved` باشند.

## تعریف ویژگی روی محصول

```json
POST /products
{
  "name": "گوشی Galaxy S24 Ultra",
  "slug": "galaxy-s24-ultra",
  "attributes": {
    "color": ["black", "titanium"],
    "storage": ["256gb", "512gb"]
  }
}
```

## ثبت / تغییر قیمت

```json
POST /seller-offers
{
  "productId": "...",
  "sellerId": "...",
  "attributes": { "color": "black", "storage": "256gb" },
  "sku": "...",
  "price": 42000000,
  "stockQuantity": 5,
  "stockStatus": "instock"
}
```

تغییر فقط قیمت (فوری):

```json
PATCH /seller-offers/:id
{ "price": 41000000 }
```
