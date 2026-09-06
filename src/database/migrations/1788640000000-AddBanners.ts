import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBanners1788640000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "banners" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "page" varchar(30) NOT NULL,
      "section" varchar(30) NOT NULL,
      "categoryId" uuid REFERENCES "categories"("id") ON DELETE CASCADE,
      "items" jsonb NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "CHK_banners_placement" CHECK (
        ("page" = 'home' AND "categoryId" IS NULL AND "section" IN ('main_slider', 'three_images', 'narrow_banner', 'video', 'two_images', 'single_banner')) OR
        ("page" = 'category_sidebar' AND "categoryId" IS NOT NULL AND "section" = 'sidebar')
      )
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_banners_home_section" ON "banners" ("section") WHERE "page" = 'home'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_banners_category_section" ON "banners" ("categoryId", "section") WHERE "page" = 'category_sidebar'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "banners"');
  }
}
