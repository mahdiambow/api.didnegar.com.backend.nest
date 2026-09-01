import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationsTables1756663200000 implements MigrationInterface {
  name = 'AddLocationsTables1756663200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "countries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_countries_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_countries_code"
      ON "countries" ("code")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_countries_legacyTable"
      ON "countries" ("legacyTable")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "states" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "countryId" uuid NOT NULL,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_states_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_states_countryId"
          FOREIGN KEY ("countryId") REFERENCES "countries"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_states_countryId_code"
      ON "states" ("countryId", "code")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_states_countryId"
      ON "states" ("countryId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "countryId" uuid,
        "stateId" uuid,
        "name" character varying(255) NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cities_countryId"
          FOREIGN KEY ("countryId") REFERENCES "countries"("id")
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "FK_cities_stateId"
          FOREIGN KEY ("stateId") REFERENCES "states"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cities_countryId"
      ON "cities" ("countryId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cities_stateId"
      ON "cities" ("stateId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cities_name"
      ON "cities" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "states"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "countries"`);
  }
}
