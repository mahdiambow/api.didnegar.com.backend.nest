import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { DatabaseSeedService } from '../database.seed.service.js';

async function run() {
  process.env.SEED_ON_STARTUP = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    await app.get(DatabaseSeedService).seedAll();
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
