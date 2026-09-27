import type { MigrationInterface, QueryRunner } from 'typeorm';

type RefColumn = {
  COLUMN_TYPE: string;
  CHARACTER_SET_NAME: string | null;
  COLLATION_NAME: string | null;
};

/** Preserves legacy customer records for later order/payment migration. */
export class CreateCustomers1790000000035 implements MigrationInterface {
  name = 'CreateCustomers1790000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const referenceType = (column: RefColumn) =>
      `${column.COLUMN_TYPE}${
        column.CHARACTER_SET_NAME
          ? ` CHARACTER SET ${column.CHARACTER_SET_NAME} COLLATE ${column.COLLATION_NAME}`
          : ''
      }`;

    const loadRef = async (table: string): Promise<RefColumn> => {
      const [column] = await queryRunner.query(`
        SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = '${table}'
          AND COLUMN_NAME = 'id'
      `);
      if (!column) {
        throw new Error(`Cannot resolve ${table}.id definition.`);
      }
      return column;
    };

    const userId = await loadRef('users');
    const countryId = await loadRef('countries');
    const stateId = await loadRef('states');
    const cityId = await loadRef('cities');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`customers\` (
        \`id\` CHAR(26) NOT NULL,
        \`legacyId\` BIGINT NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`userId\` ${referenceType(userId)} NULL,
        \`username\` VARCHAR(60) NULL,
        \`firstName\` VARCHAR(255) NULL,
        \`lastName\` VARCHAR(255) NULL,
        \`email\` VARCHAR(320) NULL,
        \`countryId\` ${referenceType(countryId)} NULL,
        \`postalCode\` VARCHAR(20) NULL,
        \`cityId\` ${referenceType(cityId)} NULL,
        \`stateId\` ${referenceType(stateId)} NULL,
        \`createdAt\` DATETIME(6) NULL,
        \`lastActiveAt\` DATETIME(6) NULL,
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_customers_legacy_table_id\` (\`legacyTable\`, \`legacyId\`),
        INDEX \`IDX_customers_user_id\` (\`userId\`),
        INDEX \`IDX_customers_country_id\` (\`countryId\`),
        INDEX \`IDX_customers_state_id\` (\`stateId\`),
        INDEX \`IDX_customers_city_id\` (\`cityId\`),
        CONSTRAINT \`FK_customers_user_id\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_customers_country_id\` FOREIGN KEY (\`countryId\`) REFERENCES \`countries\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_customers_state_id\` FOREIGN KEY (\`stateId\`) REFERENCES \`states\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_customers_city_id\` FOREIGN KEY (\`cityId\`) REFERENCES \`cities\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `customers`');
  }
}
