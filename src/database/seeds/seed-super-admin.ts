import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { RolesSeedService } from '../../roles/roles.seed.service.js';
import { UsersSeedService } from './users.seed.service.js';
import { SellersSeedService } from './sellers.seed.service.js';

/** پیش‌فرض: مهدی شیخ — سوپرادمین + سوپرسِلِر */
const DEFAULT_USERNAME = '09393341873';

async function run() {
  process.env.SEED_ON_STARTUP = 'false';

  const username = (process.argv[2] || DEFAULT_USERNAME).trim();
  if (!/^09\d{9}$/.test(username)) {
    throw new Error(`شماره نامعتبر: ${username}`);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    await app.get(RolesSeedService).seed();
    const user = await app.get(UsersSeedService).seedSuperAdmin(username);
    await app.get(SellersSeedService).seed();

    // مطمئن شو همین شماره به فروشگاه لینک شده (حتی اگر در لیست ثابت seed نبود)
    const seller = await app
      .get(SellersSeedService)
      .ensureUserLinkedToDefaultSeller(username);

    console.log(
      JSON.stringify(
        {
          ok: true,
          userId: user.id,
          username,
          sellerId: seller?.id ?? null,
          roles: ['super-admin', 'super-seller'],
          password: process.env.SEED_DEFAULT_PASSWORD || 'Admin@1234',
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
