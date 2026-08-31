# Auth Module (NestJS)

## ساختار

```
src/
├── entities/
│   ├── user.entity.ts          # بر اساس schema داده‌شده + role, otpCode, otpExpiresAt
│   ├── user-profile.entity.ts  # کد ملی، تاریخ تولد (1-به-1 با User)
│   ├── user-address.entity.ts  # آدرس‌ها (چند به یک با User)
│   └── refresh-token.entity.ts # هش refreshToken‌های فعال هر کاربر
├── enums/user-role.enum.ts
├── dto/
├── interfaces/jwt-payload.interface.ts
├── strategies/jwt.strategy.ts
├── guards/jwt-auth.guard.ts
├── auth.service.ts
├── auth.controller.ts
└── auth.module.ts
```

## نکات مهم طراحی

1. **login/signup یکپارچه**: `POST /auth/login-or-signup` با ورودی `{ mobile }`.
   اگر کاربر با این شماره وجود نداشته باشد ساخته می‌شود (سطر جدید در `users`).
   سپس یک کد OTP تولید و (فعلاً به‌صورت `console.log`) "ارسال" می‌شود و یک
   `otpToken` کوتاه‌مدت (۵ دقیقه، JWT با `purpose: 'otp'`) برگردانده می‌شود.
   این توکن حاوی رمز عبور یا اطلاعات حساس نیست، فقط `userId` و `mobile`.

2. **OTP استاتیک**: مقدار پیش‌فرض `123456` از طریق env کنترل می‌شود
   (`OTP_STATIC_CODE`). در محیط dev همیشه این کد پذیرفته می‌شود، حتی اگر
   کد واقعی تولیدشده چیز دیگری باشد. برای پروداکشن مقدار env را خالی بگذارید
   تا فقط کد واقعی هش‌شده در دیتابیس پذیرفته شود.

3. **verifyOtp**: `POST /auth/verify-otp` با `{ otpToken, code }` (کد ۶ رقمی).
   در صورت موفقیت: `{ userId, role, accessToken, refreshToken, hasPassword }`.
   `accessToken` عمر ۱۵ دقیقه و `refreshToken` عمر ۳۰ روز دارد.
   هش `refreshToken` (نه خودش) در جدول `refresh_tokens` ذخیره می‌شود.

4. **validateToken**: `POST /auth/validate-token` با `{ accessToken, refreshToken? }`.
   - اگر `accessToken` معتبر باشد → `{ valid, userId, role }`.
   - اگر منقضی/نامعتبر باشد و `refreshToken` ارسال شده باشد → رفرش خودکار انجام
     می‌شود و توکن‌های جدید (با چرخش/rotation) برگردانده می‌شود.
   - اگر `refreshToken` هم نامعتبر باشد → خطای 401.

5. **setPassword**: `POST /auth/set-password` (نیازمند `Authorization: Bearer <accessToken>`)
   با `{ password }`. پسورد با `bcrypt` هش و ذخیره می‌شود.

6. **role**: در schema اولیه فیلد role وجود نداشت؛ به `User` اضافه شده
   (`enum: user | admin | support`, پیش‌فرض `user`) چون در `validateToken`
   لازم است برگردانده شود.

## متغیرهای محیطی (.env)

```
JWT_SECRET=change-me-to-a-long-random-secret
OTP_STATIC_CODE=123456   # در پروداکشن خالی بگذارید
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASS=...
DB_NAME=...
```

## نصب پکیج‌های لازم

```bash
npm i @nestjs/typeorm typeorm pg \
      @nestjs/jwt @nestjs/passport passport passport-jwt \
      @nestjs/config bcrypt class-validator class-transformer
npm i -D @types/passport-jwt @types/bcrypt
```

## نکاتی برای ادامه کار (پیشنهادی، خارج از اسکوپ فعلی)

- **ارسال واقعی پیامک**: تابع `console.log` در `loginOrSignup` باید با
  اتصال به سرویس پیامک (کاوه‌نگار، ملی‌پیامک و ...) جایگزین شود.
- **Rate limit روی OTP**: برای جلوگیری از حملات brute-force روی کد ۶ رقمی،
  پیشنهاد می‌شود `@nestjs/throttler` روی `verify-otp` و `login-or-signup`
  فعال شود (مثلاً حداکثر ۵ تلاش در ۱۰ دقیقه).
- **ProfileModule / AddressModule جدا**: اینتیتی‌های `UserProfile` و
  `UserAddress` آماده‌اند؛ برای CRUD کامل آدرس‌ها (افزودن/ویرایش/حذف/تعیین
  آدرس پیش‌فرض) بهتر است یک ماژول جدا (`users` یا `addresses`) با
  `JwtAuthGuard` ساخته شود که از همین اسکیما استفاده می‌کند.
- اگر تعداد سرور بالا رود، ذخیره OTP روی خود جدول `users` مناسب نیست؛
  بهتر است به Redis (با TTL طبیعی) منتقل شود.
