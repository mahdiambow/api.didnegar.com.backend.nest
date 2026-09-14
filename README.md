# api.didnegar.com.backend.nest

بک‌اند NestJS فروشگاه دیدنگار (MySQL 8 + TypeORM).

## پیش‌نیازها

- **Node.js** `>= 20.11` (پیشنهاد: 22 LTS)
- **npm**
- **Docker Desktop** (برای MySQL و phpMyAdmin)
- Git

## راه‌اندازی لوکال (قدم‌به‌قدم)

### ۱) کلون و ورود به پروژه

```bash
git clone <REPO_URL>
cd api.didnegar.com.backend.nest
```

### ۲) نصب پکیج‌ها

```bash
npm install
```

### ۳) ساخت فایل `.env`

```bash
cp .env.example .env
```

مقادیر مهم (پیش‌فرض `.env.example` برای لوکال کافی است):

| متغیر | مقدار لوکال | توضیح |
|--------|-------------|--------|
| `DB_HOST` | `localhost` | وقتی Nest روی هاست اجرا می‌شود |
| `DB_PORT` | `3309` | پورت publish‌شدهٔ MySQL روی ماشین شما |
| `DB_DATABASE` | `didnegar` | دیتابیس Nest |
| `SOURCE_DATABASE` | `didnegar_new` | فقط برای ایمپورت دامپ لگاسی |
| `JWT_SECRET` | یک رشتهٔ بلند تصادفی | حتماً عوض کنید |
| `MYSQL_ROOT_PASSWORD` | `root` | برای Docker MySQL / phpMyAdmin |

Media/SFTP را اگر لازم ندارید خالی بگذارید.

### ۴) روشن کردن Docker Desktop

Docker باید در حال اجرا باشد؛ وگرنه اتصال به دیتابیس با `ECONNREFUSED` روی پورت `3309` قطع می‌شود.

### ۵) بالا آوردن MySQL (+ phpMyAdmin)

فقط دیتابیس (حالت پیشنهادی برای توسعه):

```bash
docker compose up -d mysql phpmyadmin
```

صبر کنید تا healthy شود:

```bash
docker compose ps
```

| سرویس | آدرس |
|--------|------|
| MySQL | `localhost:3309` |
| phpMyAdmin | http://localhost:8080 (user: `root` / password: مقدار `MYSQL_ROOT_PASSWORD`) |

دادهٔ MySQL در volume `mysql_data` می‌ماند.  
`docker compose down` داده را نگه می‌دارد؛ `docker compose down -v` پاک می‌کند.

### ۶) اجرای API

```bash
npm run start:dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api  

مایگریشن‌ها موقع استارت API خودکار اجرا می‌شوند (`migrationsRun: true`).  
سید خودکار خاموش است (`SEED_ON_STARTUP=false`).

### ۷) (اختیاری) سید اولیهٔ پلتفرم

اگر دیتابیس خالی است و نقش/یوزر پایه می‌خواهید:

```bash
npm run db:seed:initial
```

برای ریست کامل‌تر پلتفرم (با احتیاط):

```bash
npm run db:seed
```

### ۸) (اختیاری) ایمپورت دامپ لگاسی

اگر دامپ روی همان MySQL به‌صورت دیتابیس `didnegar_new` لود شده:

```bash
npm run db:import:legacy -- all
# یا یک استپ، مثلاً:
npm run db:import:legacy -- products
```

- مقصد همیشه `DB_DATABASE` (`didnegar`) است.  
- Nest را به `didnegar_new` وصل نکنید.  
- مدیا به‌صورت پیش‌فرض داخل `all` نیست.

---

## حالت جایگزین: همه چیز داخل Docker

API هم داخل compose:

```bash
cp .env.example .env
# JWT_SECRET را عوض کنید
docker compose up -d --build
```

داخل شبکهٔ Docker، سرویس `api` خودش `DB_HOST=mysql` و `DB_PORT=3306` می‌گیرد (نیازی به عوض کردن `.env` برای هاست نیست). روی سرور هرگز به `migration-mysql` وصل نشوید.

---

## دستورات پرکاربرد

```bash
npm run start:dev      # توسعه با watch
npm run build          # بیلد
npm run start:prod     # اجرای dist
npm run test           # تست
npm run lint           # لینت
npm run migration:run  # اجرای دستی مایگریشن‌ها
```

---

## عیب‌یابی سریع

| مشکل | کار |
|------|-----|
| `ECONNREFUSED ...:3309` | Docker Desktop را روشن کنید، بعد `docker compose up -d mysql` |
| پورت 3309 اشغال است | در `.env` مقدار `DB_PORT` را عوض کنید و دوباره compose را بالا بیاورید |
| مایگریشن / اسکیما عجیب | به Postgres قدیمی وصل نباشید؛ فقط MySQL همین پروژه |
| Swagger توکن را نگه نمی‌دارد | در `.env`: `SWAGGER_PERSIST_AUTH=true` |

---

## انتقال ایمیج API به سرور دیگر

```bash
docker build -t didnegar-api:latest .
# اگر روی ARM برای سرور x86 می‌سازید:
# docker build --platform linux/amd64 -t didnegar-api:latest .
docker save -o didnegar-api.tar didnegar-api:latest
```

روی مقصد، کنار `docker-compose.yml` و `.env` تنظیم‌شده:

```bash
docker load -i didnegar-api.tar
docker compose up -d --no-build
```
