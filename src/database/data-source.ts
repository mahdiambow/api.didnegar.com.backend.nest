import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { assertAppMysqlTarget } from '../config/assert-app-mysql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

assertAppMysqlTarget(process.env.DB_HOST, process.env.DB_PORT);

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4',
  entities: [join(__dirname, '../**/*.entity.js')],
  migrations: [join(__dirname, 'migrations/*.js')],
});
